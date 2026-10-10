-- ==============================================================================
-- Conteúdo automático: liturgia do dia e notícias da Igreja
-- Rodar uma vez no SQL Editor de um banco criado antes de 10/10/2026.
-- Quem preenche essas tabelas é o robô do GitHub Actions (scripts/update-content.mjs),
-- com a chave service_role; o app só lê.
-- ==============================================================================

-- Liturgia: o robô guarda cor, título e referências das leituras (não o texto, que tem
-- direitos autorais) e o link para ler as leituras completas na fonte.
ALTER TABLE public.daily_liturgy ALTER COLUMN gospel_text DROP NOT NULL;
ALTER TABLE public.daily_liturgy ADD COLUMN IF NOT EXISTS source_url TEXT;

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
