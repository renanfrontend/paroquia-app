// Robô de conteúdo (roda no GitHub Actions, .github/workflows/conteudo.yml):
// grava a liturgia de hoje e as manchetes da Igreja no Supabase. O app só lê essas tabelas.
//
// Precisa de SUPABASE_SERVICE_ROLE_KEY (segredo do repositório: nunca no código nem no app).
// A URL vem de SUPABASE_URL ou de src/config/supabase.public.json.
import { readFileSync } from 'node:fs'
import { parseLiturgy, parseRss, todayInBrazil } from './content-parsers.mjs'

const LITURGY_URL = 'https://liturgia.cancaonova.com/pb/'
const FEEDS = [
  { source: 'VATICAN_NEWS', url: 'https://www.vaticannews.va/pt.rss.xml' },
  { source: 'CNBB', url: 'https://www.cnbb.org.br/feed/' },
]
const KEEP_NEWS_DAYS = 45

const publicConfig = JSON.parse(readFileSync(new URL('../src/config/supabase.public.json', import.meta.url), 'utf8'))
const supabaseUrl = (process.env.SUPABASE_URL || publicConfig.url || '').replace(/\/$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Defina SUPABASE_SERVICE_ROLE_KEY nos segredos do repositório (veja o README).')
  process.exit(1)
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
}

const download = async (url) => {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ParoquiaConectada/1.0 (+https://github.com/renanfrontend/paroquia-app)' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`${url} respondeu ${response.status}`)
  return response.text()
}

const upsert = async (table, rows, conflict) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=${conflict}`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  })
  if (!response.ok) throw new Error(`Gravar em ${table}: ${response.status} ${await response.text()}`)
}

let failures = 0

// Liturgia de hoje (a fonte só publica o dia corrente).
try {
  const liturgy = parseLiturgy(await download(LITURGY_URL))
  const today = todayInBrazil()
  if (liturgy.date !== today) {
    console.log(`Liturgia: a fonte ainda mostra ${liturgy.date} (hoje é ${today}); tento de novo na próxima execução.`)
  } else {
    // merge-duplicates só atualiza estas colunas: textos e reflexões cadastrados à mão são mantidos.
    await upsert('daily_liturgy', [{ ...liturgy, source_url: LITURGY_URL }], 'date')
    console.log(`Liturgia de ${liturgy.date}: ${liturgy.title} (${liturgy.liturgical_color}), evangelho ${liturgy.gospel_ref}`)
  }
} catch (error) {
  failures++
  console.error('Liturgia:', error.message)
}

// Manchetes da Igreja.
for (const feed of FEEDS) {
  try {
    const items = parseRss(await download(feed.url), feed.source)
    if (items.length) await upsert('church_news', items, 'link')
    console.log(`${feed.source}: ${items.length} manchetes`)
  } catch (error) {
    failures++
    console.error(`${feed.source}:`, error.message)
  }
}

// Mantém só as manchetes recentes.
try {
  const cutoff = new Date(Date.now() - KEEP_NEWS_DAYS * 86_400_000).toISOString()
  const response = await fetch(`${supabaseUrl}/rest/v1/church_news?published_at=lt.${cutoff}`, { method: 'DELETE', headers })
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
} catch (error) {
  failures++
  console.error('Limpeza das manchetes antigas:', error.message)
}

// Uma fonte fora do ar não derruba as outras, mas a execução fica marcada como falha no GitHub.
process.exit(failures ? 1 : 0)
