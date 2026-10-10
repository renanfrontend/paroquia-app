// Roda o supabase-schema.sql num Postgres real (PGlite, Postgres em WebAssembly) imitando o Supabase
// (papéis anon/authenticated e auth.uid()) e confere as regras de segurança (RLS) e as funções.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("supabase-schema.sql: permissões e contadores", { timeout: 120_000 }, async () => {
const schemaPath = new URL("../supabase-schema.sql", import.meta.url);
const db = new PGlite();

// --- imitação mínima do Supabase -------------------------------------------------
await db.exec(`
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  GRANT USAGE ON SCHEMA auth TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
  GRANT USAGE ON SCHEMA public TO anon, authenticated;
`);

await db.exec(readFileSync(schemaPath, "utf8"));
// Os grants usados no teste são os mesmos do banco de produção.
await db.exec(readFileSync(new URL("./fixtures/parish-demo.sql", import.meta.url), "utf8"));

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const ADM = "33333333-3333-3333-3333-333333333333";
await db.exec(`
  INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    ('${A}', 'a@x.com', '{"full_name":"Ana"}'), ('${B}', 'b@x.com', '{"full_name":"Bruno"}'), ('${ADM}', 'adm@x.com', '{}');
  -- SQL Editor (sem usuário logado) nomeia o primeiro admin
  UPDATE public.profiles SET role = 'ADMIN_PARISH' WHERE id = '${ADM}';
`);

/** Executa como um usuário (uid) ou anônimo (null), dentro de uma transação. */
async function as(uid, sql, params = []) {
  await db.exec("BEGIN");
  try {
    await db.exec(`SET LOCAL ROLE ${uid ? "authenticated" : "anon"}`);
    await db.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [uid ?? ""]);
    const result = await db.query(sql, params);
    await db.exec("COMMIT");
    return { rows: result.rows, affected: result.affectedRows ?? 0 };
  } catch (error) {
    await db.exec("ROLLBACK");
    return { error: error.message };
  }
}

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  if (!ok) console.log(`ERRO ${name}${detail ? ` — ${detail}` : ""}`);
};

// 1. Leitura pública e perfis
let r = await as(A, "SELECT count(*)::int AS n FROM public.mass_schedules");
check("logado lê os horários de missa (sem recursão)", !r.error && r.rows[0].n > 0, r.error);
r = await as(null, "SELECT count(*)::int AS n FROM public.mass_schedules");
check("anônimo lê os horários de missa", !r.error && r.rows[0].n > 0, r.error);
r = await as(A, "SELECT id FROM public.profiles");
check("cada um vê só o próprio perfil", !r.error && r.rows.length === 1 && r.rows[0].id === A, r.error ?? JSON.stringify(r.rows));
r = await as(ADM, "SELECT count(*)::int AS n FROM public.profiles");
check("admin vê todos os perfis", !r.error && r.rows[0].n === 3, r.error);
check("perfil criado no cadastro com o nome", (await db.query(`SELECT full_name FROM public.profiles WHERE id='${A}'`)).rows[0].full_name === "Ana");

// 2. Papéis
r = await as(A, `UPDATE public.profiles SET role='ADMIN_PARISH' WHERE id='${A}'`);
check("membro não vira admin sozinho", Boolean(r.error), "a atualização passou");
r = await as(A, `UPDATE public.profiles SET full_name='Ana Maria' WHERE id='${A}'`);
check("membro edita o próprio nome", !r.error && r.affected === 1, r.error);
r = await as(A, `UPDATE public.profiles SET full_name='X' WHERE id='${B}'`);
check("membro não edita o perfil de outra pessoa", !r.error && r.affected === 0, r.error);
r = await as(ADM, `UPDATE public.profiles SET role='PASTORAL_LEADER' WHERE id='${B}'`);
check("admin nomeia uma liderança", !r.error && r.affected === 1, r.error);

// 3. Pedidos de oração
r = await as(null, `INSERT INTO public.prayer_requests (user_id, author_name, intention) VALUES ('${A}', 'Falso', 'teste') RETURNING id`);
check("anônimo não cria pedido em nome de outra pessoa", Boolean(r.error));
r = await as(null, `INSERT INTO public.prayer_requests (author_name, intention, prayers_count) VALUES ('X', 'teste', 999) RETURNING id`);
check("não dá para criar pedido com contador inflado", Boolean(r.error));
r = await as(A, `INSERT INTO public.prayer_requests (user_id, author_name, intention) VALUES ('${A}', 'Maria', 'Pela saúde da minha mãe') RETURNING id`);
check("membro cria pedido próprio", !r.error && r.rows.length === 1, r.error);
const publicPrayer = r.rows?.[0]?.id;
r = await as(B, `INSERT INTO public.prayer_requests (user_id, author_name, intention, is_private) VALUES ('${B}', 'Bruno', 'Intenção privada', true) RETURNING id`);
check("logado cria pedido privado", !r.error, r.error);
const privatePrayer = r.rows?.[0]?.id;
r = await as(A, `SELECT id FROM public.prayer_requests WHERE id='${privatePrayer}'`);
check("pedido privado não aparece para outros", !r.error && r.rows.length === 0);
r = await as(B, `SELECT id FROM public.prayer_requests WHERE id='${privatePrayer}'`);
check("autor vê o próprio pedido privado", !r.error && r.rows.length === 1);
r = await as(ADM, `SELECT id FROM public.prayer_requests WHERE id='${privatePrayer}'`);
check("admin vê pedido privado (moderação)", !r.error && r.rows.length === 1);
r = await as(null, `UPDATE public.prayer_requests SET intention='alterado', is_private=false WHERE id='${publicPrayer}'`);
check("anônimo não altera pedido", Boolean(r.error));
r = await as(A, `UPDATE public.prayer_requests SET is_private=false WHERE id='${privatePrayer}'`);
check("ninguém torna público o pedido privado de outro", !r.error && r.affected === 0, r.error);
r = await as(null, `INSERT INTO public.prayer_requests (author_name, intention) VALUES ('X', repeat('a', 1001))`);
check("pedido com texto gigante é recusado", Boolean(r.error));

// 4. Contadores
r = await as(A, "SELECT public.increment_prayer_support($1) AS n", [publicPrayer]);
check("'rezei por você' soma 1", !r.error && r.rows[0].n === 1, r.error);
r = await as(A, "SELECT public.increment_prayer_support($1) AS n", [publicPrayer]);
check("a mesma pessoa não soma duas vezes", !r.error && r.rows[0].n === 1, r.error);
r = await as(null, "SELECT public.increment_prayer_support($1) AS n", [publicPrayer]);
check("anônimo não intercede", Boolean(r.error));
r = await as(B, "SELECT public.increment_prayer_support($1) AS n", [publicPrayer]);
check("outro membro intercede", !r.error && r.rows[0].n === 2, r.error);
r = await as(A, "SELECT user_id FROM public.prayer_supports");
check("intercessões de outras pessoas são privadas", !r.error && r.rows.length === 1 && r.rows[0].user_id === A);
r = await as(null, "SELECT public.light_candle($1)", [publicPrayer]);
check("anônimo não acende vela", Boolean(r.error));
r = await as(A, "SELECT public.increment_prayer_support($1) AS n", [privatePrayer]);
check("não intercede em pedido privado alheio", Boolean(r.error));
r = await as(A, "SELECT public.light_candle($1) AS n", [publicPrayer]);
check("acender vela soma 1", !r.error && r.rows[0].n === 1, r.error);
r = await as(A, "SELECT public.light_candle($1) AS n", [privatePrayer]);
check("não acende vela em pedido privado alheio", Boolean(r.error));
r = await as(null, `INSERT INTO public.prayer_supports (prayer_id) VALUES ('${publicPrayer}')`);
check("intercessão direta na tabela é bloqueada (só pela função)", Boolean(r.error));

r = await as(null, "SELECT public.like_news(gen_random_uuid())");
check("anônimo não curte notícia", Boolean(r.error));
r = await as(A, `INSERT INTO public.prayer_requests (user_id, author_name, intention, prayers_count) VALUES ('${A}', 'A', 'Teste', 999)`);
check("membro não infla contador ao criar pedido", Boolean(r.error));
r = await as(A, `INSERT INTO public.prayer_requests (user_id, author_name, intention) VALUES ('${B}', 'B', 'Teste')`);
check("membro não se passa por outro autor", Boolean(r.error));

// 5. Notícias e dízimo
const news = (await db.query("SELECT id FROM public.news_posts LIMIT 1")).rows[0].id;
r = await as(A, "SELECT public.like_news($1) AS n", [news]);
check("membro curte notícia", !r.error && r.rows[0].n === 1, r.error);
r = await as(A, `UPDATE public.news_posts SET title='hack' WHERE id='${news}'`);
check("membro não edita notícia", !r.error && r.affected === 0, r.error);
r = await as(B, `UPDATE public.news_posts SET is_pinned=false WHERE id='${news}'`);
check("liderança edita notícia", !r.error && r.affected === 1, r.error);
r = await as(A, "INSERT INTO public.news_posts (title, summary, content) VALUES ('x','y','z')");
check("membro não publica notícia", Boolean(r.error));
r = await as(A, "UPDATE public.tithe_info SET pix_key='hack'");
check("membro não altera o PIX", !r.error && r.affected === 0, r.error);
r = await as(ADM, "UPDATE public.tithe_info SET city='Campinas'");
check("admin altera os dados do dízimo", !r.error && r.affected === 1, r.error);
r = await as(ADM, "UPDATE public.tithe_info SET pix_key_type='BOLETO'");
check("tipo de chave PIX inválido é recusado", Boolean(r.error));

await db.close();
assert.equal(failures, 0, `${failures} verificação(ões) de segurança falharam (veja as linhas ERRO acima)`);
});
