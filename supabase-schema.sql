-- ==============================================================================
-- ESQUEMA COMPLETO DE BANCO DE DADOS POSTGRESQL PARA SUPABASE
-- Aplicativo Paroquial (Paróquia Conectada)
-- ==============================================================================

-- 1. EXTENSÕES & ENUMS
-- IDs com gen_random_uuid(), nativo do Postgres 13+ (dispensa a extensão uuid-ossp).

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE TYPE user_role AS ENUM ('MEMBER', 'PASTORAL_LEADER', 'ADMIN_PARISH');
CREATE TYPE day_of_week AS ENUM ('DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO');
CREATE TYPE mass_type AS ENUM ('MISSA', 'CONFISSAO', 'ADORACAO', 'TERCO', 'NOVENA');
CREATE TYPE news_category AS ENUM ('AVISO', 'EVENTO', 'PASTORAL', 'FESTA', 'CATEQUESE');
CREATE TYPE prayer_category AS ENUM ('SAUDE', 'FAMILIA', 'AGRADECIMENTO', 'FALECIMENTO', 'INTENCAO_GERAL');
CREATE TYPE liturgy_color AS ENUM ('VERDE', 'VERMELHO', 'ROXO', 'BRANCO', 'ROSA');

-- ==============================================================================
-- 2. TABELA DE PERFIS DE USUÁRIOS
-- ==============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  community_name TEXT DEFAULT 'Matriz',
  role user_role NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ==============================================================================
-- 3. TABELA DE HORÁRIOS DE MISSAS E CELEBRAÇÕES
-- ==============================================================================
CREATE TABLE public.mass_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week day_of_week NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL DEFAULT 'Igreja Matriz',
  type mass_type NOT NULL DEFAULT 'MISSA',
  description TEXT,
  celebrant TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mass_day_location ON public.mass_schedules(day_of_week, location) WHERE is_active = TRUE;
CREATE INDEX idx_mass_type ON public.mass_schedules(type) WHERE is_active = TRUE;

-- ==============================================================================
-- 4. TABELA DE LITURGIA DIÁRIA
-- ==============================================================================
CREATE TABLE public.daily_liturgy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  liturgical_color liturgy_color NOT NULL DEFAULT 'VERDE',
  title TEXT NOT NULL,
  first_reading_ref TEXT,
  first_reading_text TEXT,
  psalm_ref TEXT,
  psalm_refrain TEXT,
  psalm_text TEXT,
  second_reading_ref TEXT,
  second_reading_text TEXT,
  gospel_ref TEXT NOT NULL,
  gospel_text TEXT,
  reflection TEXT,
  audio_url TEXT,
  -- Link para as leituras completas na fonte (o robô guarda só as referências).
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_liturgy_date ON public.daily_liturgy(date);
CREATE INDEX idx_liturgy_color ON public.daily_liturgy(liturgical_color);

-- ==============================================================================
-- 5. TABELA DE MURAL DE NOTÍCIAS E AVISOS
-- ==============================================================================
CREATE TABLE public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category news_category NOT NULL DEFAULT 'AVISO',
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_published ON public.news_posts(published_at DESC);
CREATE INDEX idx_news_category ON public.news_posts(category);
CREATE INDEX idx_news_pinned ON public.news_posts(is_pinned) WHERE is_pinned = TRUE;

-- ==============================================================================
-- 6. TABELA DE PEDIDOS DE ORAÇÃO & INTENÇÕES
-- ==============================================================================
CREATE TABLE public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 80),
  intention TEXT NOT NULL CHECK (char_length(intention) BETWEEN 1 AND 1000),
  category prayer_category NOT NULL DEFAULT 'INTENCAO_GERAL',
  is_private BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  prayers_count INT DEFAULT 0,
  candles_lit INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prayer_public ON public.prayer_requests(created_at DESC) WHERE is_private = FALSE AND is_approved = TRUE;
CREATE INDEX idx_prayer_category ON public.prayer_requests(category) WHERE is_approved = TRUE;
CREATE INDEX idx_prayer_trending ON public.prayer_requests(prayers_count DESC) WHERE is_approved = TRUE;

-- Tabela para registro de intercessão ("Rezei por você")
CREATE TABLE public.prayer_supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prayer_supports_prayer ON public.prayer_supports(prayer_id);

-- ==============================================================================
-- 7. TABELA DE CONFIGURAÇÃO DE DÍZIMO E CHAVE PIX PAROQUIAL
-- ==============================================================================
CREATE TABLE public.tithe_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parish_name TEXT NOT NULL DEFAULT 'Paróquia Nossa Senhora das Graças',
  cnpj TEXT NOT NULL,
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL DEFAULT 'CNPJ'
    CHECK (pix_key_type IN ('CNPJ', 'CPF', 'EMAIL', 'TELEFONE', 'ALEATORIA')),
  -- Cidade do recebedor: obrigatória no QR Code PIX (até 15 caracteres, sem acentos no código).
  city TEXT NOT NULL DEFAULT 'São Paulo',
  bank_name TEXT DEFAULT 'Banco do Brasil',
  account_info TEXT,
  custom_message TEXT DEFAULT 'O dízimo é um ato de fé, amor e gratidão a Deus.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS POLICIES)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mass_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_liturgy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tithe_info ENABLE ROW LEVEL SECURITY;

-- Papel de quem está logado. SECURITY DEFINER lê profiles sem passar pelas políticas:
-- consultar profiles dentro de uma política de profiles causaria "infinite recursion".
CREATE OR REPLACE FUNCTION private.has_parish_role(roles user_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = ANY (roles)
  );
$$;

CREATE OR REPLACE FUNCTION private.is_parish_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.has_parish_role(ARRAY['ADMIN_PARISH']::user_role[]);
$$;

-- Perfil: cada um lê e edita o próprio; a administração lê e edita todos.
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR private.is_parish_admin());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE USING (private.is_parish_admin()) WITH CHECK (private.is_parish_admin());

-- Horários de Missas: leitura pública / escrita da administração
CREATE POLICY "Public read mass schedules" ON public.mass_schedules
  FOR SELECT USING (true);

CREATE POLICY "Admins manage mass schedules" ON public.mass_schedules
  FOR ALL USING (private.is_parish_admin()) WITH CHECK (private.is_parish_admin());

-- Liturgia: leitura pública / escrita da administração
CREATE POLICY "Public read daily liturgy" ON public.daily_liturgy
  FOR SELECT USING (true);

CREATE POLICY "Admins manage daily liturgy" ON public.daily_liturgy
  FOR ALL USING (private.is_parish_admin()) WITH CHECK (private.is_parish_admin());

-- Notícias: leitura pública / escrita de administração e lideranças
CREATE POLICY "Public read news posts" ON public.news_posts
  FOR SELECT USING (true);

CREATE POLICY "Leaders publish news" ON public.news_posts
  FOR INSERT WITH CHECK (private.has_parish_role(ARRAY['ADMIN_PARISH', 'PASTORAL_LEADER']::user_role[]));

CREATE POLICY "Leaders update news" ON public.news_posts
  FOR UPDATE USING (private.has_parish_role(ARRAY['ADMIN_PARISH', 'PASTORAL_LEADER']::user_role[]))
  WITH CHECK (private.has_parish_role(ARRAY['ADMIN_PARISH', 'PASTORAL_LEADER']::user_role[]));

CREATE POLICY "Admins delete news" ON public.news_posts
  FOR DELETE USING (private.is_parish_admin());

-- Pedidos de Oração: públicos aprovados, os próprios ou todos para a administração
CREATE POLICY "Read approved public prayers" ON public.prayer_requests
  FOR SELECT USING (
    (is_private = FALSE AND is_approved = TRUE)
    OR auth.uid() = user_id
    OR private.is_parish_admin()
  );

-- Conta autenticada: pedidos em nome próprio e sem contadores inflados.
CREATE POLICY "Authenticated users insert own prayers" ON public.prayer_requests
  FOR INSERT TO authenticated WITH CHECK (
    user_id = (SELECT auth.uid())
    AND COALESCE(prayers_count, 0) = 0
    AND COALESCE(candles_lit, 0) = 0
  );

-- Moderação pela administração; quem pediu pode apagar o próprio pedido.
-- Contadores mudam só pelas funções increment_prayer_support e light_candle.
CREATE POLICY "Admins moderate prayers" ON public.prayer_requests
  FOR UPDATE USING (private.is_parish_admin()) WITH CHECK (private.is_parish_admin());

CREATE POLICY "Authors or admins delete prayers" ON public.prayer_requests
  FOR DELETE USING (auth.uid() = user_id OR private.is_parish_admin());

-- Suporte de oração (intercessão): só a contagem é pública; registro via increment_prayer_support.
CREATE POLICY "Read own prayer supports" ON public.prayer_supports
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR private.is_parish_admin());

-- Dízimo: leitura pública / escrita da administração
CREATE POLICY "Public read tithe info" ON public.tithe_info
  FOR SELECT USING (true);

CREATE POLICY "Admins manage tithe info" ON public.tithe_info
  FOR ALL USING (private.is_parish_admin()) WITH CHECK (private.is_parish_admin());

-- ==============================================================================
-- 8.1 FUNÇÕES DE CONTADORES (chamadas pelo app com supabase.rpc)
-- ==============================================================================
-- Cada função soma 1 e nada mais, e só em pedidos/notícias que a pessoa pode ver.

-- Uma intercessão por pessoa autenticada em cada pedido.
CREATE UNIQUE INDEX IF NOT EXISTS idx_prayer_supports_unique_user
  ON public.prayer_supports(prayer_id, user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.increment_prayer_support(p_prayer_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted INT;
  total INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.prayer_requests
    WHERE id = p_prayer_id
      AND ((is_private = FALSE AND is_approved = TRUE) OR user_id = auth.uid() OR private.is_parish_admin())
  ) THEN
    RAISE EXCEPTION 'Pedido de oração não encontrado' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.prayer_supports (prayer_id, user_id)
  VALUES (p_prayer_id, auth.uid())
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;

  IF inserted > 0 THEN
    UPDATE public.prayer_requests SET prayers_count = COALESCE(prayers_count, 0) + 1
    WHERE id = p_prayer_id RETURNING prayers_count INTO total;
  ELSE
    SELECT prayers_count INTO total FROM public.prayer_requests WHERE id = p_prayer_id;
  END IF;
  RETURN total;
END;
$$;

CREATE OR REPLACE FUNCTION private.light_candle(p_prayer_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '42501';
  END IF;
  UPDATE public.prayer_requests SET candles_lit = COALESCE(candles_lit, 0) + 1
  WHERE id = p_prayer_id
    AND ((is_private = FALSE AND is_approved = TRUE) OR user_id = auth.uid() OR private.is_parish_admin())
  RETURNING candles_lit INTO total;
  IF total IS NULL THEN
    RAISE EXCEPTION 'Pedido de oração não encontrado' USING ERRCODE = 'P0002';
  END IF;
  RETURN total;
END;
$$;

CREATE OR REPLACE FUNCTION private.like_news(p_news_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '42501';
  END IF;
  UPDATE public.news_posts SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_news_id
  RETURNING likes_count INTO total;
  IF total IS NULL THEN
    RAISE EXCEPTION 'Notícia não encontrada' USING ERRCODE = 'P0002';
  END IF;
  RETURN total;
END;
$$;





-- ==============================================================================
-- 9. TRIGGERS AUTOMÁTICOS
-- ==============================================================================

-- Trigger para criar perfil automático no auth.users signup
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Fiel Paroquiano'),
    NEW.email,
    'MEMBER'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- Ninguém muda o próprio papel (MEMBER → ADMIN_PARISH): só a administração ou o SQL Editor.
-- No SQL Editor não há usuário logado (auth.uid() nulo), então dá para nomear o primeiro admin.
CREATE OR REPLACE FUNCTION private.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL AND NOT private.is_parish_admin() THEN
    RAISE EXCEPTION 'Apenas a administração da paróquia pode alterar papéis' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.protect_profile_role();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION private.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at();

DROP TRIGGER IF EXISTS update_mass_schedules_updated_at ON public.mass_schedules;
CREATE TRIGGER update_mass_schedules_updated_at BEFORE UPDATE ON public.mass_schedules
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at();

DROP TRIGGER IF EXISTS update_news_posts_updated_at ON public.news_posts;
CREATE TRIGGER update_news_posts_updated_at BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at();

DROP TRIGGER IF EXISTS update_tithe_info_updated_at ON public.tithe_info;
CREATE TRIGGER update_tithe_info_updated_at BEFORE UPDATE ON public.tithe_info
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at();

-- ==============================================================================
-- 10. PRIVILÉGIOS EXPLÍCITOS E REALTIME

CREATE FUNCTION public.increment_prayer_support(p_prayer_id UUID) RETURNS INT
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.increment_prayer_support(p_prayer_id); $$;
REVOKE ALL ON FUNCTION public.increment_prayer_support(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_prayer_support(UUID) TO authenticated;

CREATE FUNCTION public.light_candle(p_prayer_id UUID) RETURNS INT
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.light_candle(p_prayer_id); $$;
REVOKE ALL ON FUNCTION public.light_candle(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.light_candle(UUID) TO authenticated;

CREATE FUNCTION public.like_news(p_news_id UUID) RETURNS INT
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.like_news(p_news_id); $$;
REVOKE ALL ON FUNCTION public.like_news(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.like_news(UUID) TO authenticated;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_parish_role(user_role[]), private.is_parish_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.increment_prayer_support(UUID), private.light_candle(UUID), private.like_news(UUID) TO authenticated;
REVOKE ALL ON public.profiles, public.mass_schedules, public.daily_liturgy, public.news_posts, public.prayer_requests, public.prayer_supports, public.tithe_info FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.mass_schedules, public.daily_liturgy, public.news_posts, public.prayer_requests, public.tithe_info TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.mass_schedules, public.daily_liturgy, public.news_posts, public.prayer_requests, public.tithe_info TO authenticated;
GRANT SELECT ON public.prayer_supports TO authenticated;
CREATE INDEX idx_news_author ON public.news_posts(author_id);
CREATE INDEX idx_prayer_user ON public.prayer_requests(user_id);
CREATE INDEX idx_support_user ON public.prayer_supports(user_id);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_requests, public.news_posts, public.daily_liturgy;
  END IF;
END $$;

-- ==============================================================================
-- NOTÍCIAS DA IGREJA (preenchidas pelo robô scripts/update-content.mjs)
-- ==============================================================================
-- Manchetes da Igreja (Vatican News em português e CNBB), com link para a matéria original.
CREATE TABLE IF NOT EXISTS public.church_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('VATICAN_NEWS', 'CNBB')),
  title TEXT NOT NULL,
  summary TEXT,
  link TEXT NOT NULL UNIQUE,
  image_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_church_news_published ON public.church_news(published_at DESC);

ALTER TABLE public.church_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read church news" ON public.church_news;
CREATE POLICY "Public read church news" ON public.church_news
  FOR SELECT USING (true);

-- Leitura para o app; escrita só pela chave service_role (que ignora o RLS).
REVOKE ALL ON public.church_news FROM anon, authenticated;
GRANT SELECT ON public.church_news TO anon, authenticated;

-- Tempo real: notícias novas aparecem no app sem recarregar.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'church_news'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.church_news;
  END IF;
END $$;
