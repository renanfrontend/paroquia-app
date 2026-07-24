-- ==============================================================================
-- ESQUEMA COMPLETO DE BANCO DE DADOS POSTGRESQL PARA SUPABASE
-- Aplicativo Paroquial (Paróquia Conectada)
-- ==============================================================================

-- 1. EXTENSÕES & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  role user_role DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ==============================================================================
-- 3. TABELA DE HORÁRIOS DE MISSAS E CELEBRAÇÕES
-- ==============================================================================
CREATE TABLE public.mass_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  gospel_text TEXT NOT NULL,
  reflection TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_liturgy_date ON public.daily_liturgy(date);
CREATE INDEX idx_liturgy_color ON public.daily_liturgy(liturgical_color);

-- ==============================================================================
-- 5. TABELA DE MURAL DE NOTÍCIAS E AVISOS
-- ==============================================================================
CREATE TABLE public.news_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  intention TEXT NOT NULL,
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prayer_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prayer_supports_prayer ON public.prayer_supports(prayer_id);

-- ==============================================================================
-- 7. TABELA DE CONFIGURAÇÃO DE DÍZIMO E CHAVE PIX PAROQUIAL
-- ==============================================================================
CREATE TABLE public.tithe_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parish_name TEXT NOT NULL DEFAULT 'Paróquia Nossa Senhora das Graças',
  cnpj TEXT NOT NULL,
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL DEFAULT 'CNPJ',
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

-- Perfil: Leitura do próprio perfil + admin lê todos
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'ADMIN_PARISH'
  ));

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Horários de Missas: Leitura pública / Escrita para Admins
CREATE POLICY "Public read mass schedules" ON public.mass_schedules
  FOR SELECT USING (true);

CREATE POLICY "Admins manage mass schedules" ON public.mass_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN_PARISH')
  );

-- Liturgia: Leitura pública
CREATE POLICY "Public read daily liturgy" ON public.daily_liturgy
  FOR SELECT USING (true);

CREATE POLICY "Admins manage daily liturgy" ON public.daily_liturgy
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN_PARISH')
  );

-- Notícias: Leitura pública / Escrita Admins e Líderes
CREATE POLICY "Public read news posts" ON public.news_posts
  FOR SELECT USING (true);

CREATE POLICY "Leaders publish news" ON public.news_posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN_PARISH', 'PASTORAL_LEADER'))
  );

CREATE POLICY "Leaders update their news" ON public.news_posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN_PARISH', 'PASTORAL_LEADER'))
  );

-- Pedidos de Oração: Públicas aprovadas ou privadas do próprio usuário ou admin
CREATE POLICY "Read approved public prayers" ON public.prayer_requests
  FOR SELECT USING (
    (is_private = FALSE AND is_approved = TRUE) 
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN_PARISH')
  );

CREATE POLICY "Anyone can insert prayer request" ON public.prayer_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update prayer counters" ON public.prayer_requests
  FOR UPDATE USING (true); -- Qualquer um pode incrementar contadores

-- Suporte de oração (intercessão)
CREATE POLICY "Public read prayer supports" ON public.prayer_supports
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert support" ON public.prayer_supports
  FOR INSERT WITH CHECK (true);

-- Dízimo: Leitura pública
CREATE POLICY "Public read tithe info" ON public.tithe_info
  FOR SELECT USING (true);

CREATE POLICY "Admins manage tithe info" ON public.tithe_info
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN_PARISH')
  );

-- ==============================================================================
-- 9. TRIGGERS AUTOMÁTICOS
-- ==============================================================================

-- Trigger para criar perfil automático no auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_mass_schedules_updated_at ON public.mass_schedules;
CREATE TRIGGER update_mass_schedules_updated_at BEFORE UPDATE ON public.mass_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_news_posts_updated_at ON public.news_posts;
CREATE TRIGGER update_news_posts_updated_at BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_tithe_info_updated_at ON public.tithe_info;
CREATE TRIGGER update_tithe_info_updated_at BEFORE UPDATE ON public.tithe_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==============================================================================
-- 10. DADOS INICIAIS DE EXEMPLO (OPCIONAL)
-- ==============================================================================

-- Inserir uma paróquia exemplo
INSERT INTO public.tithe_info (parish_name, cnpj, pix_key, pix_key_type, bank_name, custom_message)
VALUES (
  'Paróquia Nossa Senhora das Graças',
  '12.345.678/0001-90',
  '123e4567-e89b-12d3-a456-426614174000',
  'CNPJ',
  'Banco do Brasil',
  'O dízimo é um ato de fé, amor e coresponsabilidade com Deus e nossa comunidade paroquial.'
);

-- Insertar horários de exemplo
INSERT INTO public.mass_schedules (day_of_week, time, location, type, celebrant, description)
VALUES
  ('DOMINGO', '07:00', 'Igreja Matriz', 'MISSA', 'Pe. João', NULL),
  ('DOMINGO', '09:00', 'Igreja Matriz', 'MISSA', 'Pe. Maria', 'Missa Solene'),
  ('DOMINGO', '18:00', 'Igreja Matriz', 'MISSA', 'Pe. José', NULL),
  ('SEGUNDA', '07:00', 'Igreja Matriz', 'MISSA', 'Pe. João', NULL),
  ('TERCA', '07:00', 'Igreja Matriz', 'MISSA', 'Pe. Maria', NULL),
  ('QUARTA', '07:00', 'Igreja Matriz', 'MISSA', 'Pe. José', NULL),
  ('QUINTA', '07:00', 'Igreja Matriz', 'MISSA', 'Pe. João', NULL),
  ('SEXTA', '07:00', 'Igreja Matriz', 'MISSA', 'Pe. Maria', NULL),
  ('SABADO', '15:00', 'Igreja Matriz', 'CONFISSAO', NULL, 'Confissão'),
  ('DOMINGO', '08:30', 'Igreja Matriz', 'ADORACAO', NULL, 'Adoração Eucarística');

-- Insertar exemplo de liturgia
INSERT INTO public.daily_liturgy (date, liturgical_color, title, gospel_ref, gospel_text, reflection)
VALUES (
  CURRENT_DATE,
  'VERDE',
  'Domingo Comum do Tempo Ordinário',
  'Mt 6:25-34',
  'Jesus disse a seus discípulos: "Não vos preocupeis pela vossa vida, com o que haveis de comer ou beber..."',
  'Confiemos em Deus e busquemos primeiro o Reino de Deus e sua justiça.'
);

-- Insertar notícia de exemplo
INSERT INTO public.news_posts (title, summary, content, category, is_pinned, published_at)
VALUES (
  'Convite: Retiro Espiritual de Setembro',
  'Estamos convidando todos os membros da paróquia para nosso retiro anual.',
  'Plenamente dedicado ao crescimento espiritual de nossa comunidade, o retiro deste ano será realizado no fim de semana de 15 a 17 de setembro...',
  'EVENTO',
  TRUE,
  NOW()
);

-- ==============================================================================
-- DONE!
-- ==============================================================================
-- Todos os objetos foram criados com sucesso.
-- Próximas ações:
-- 1. Configurar variáveis de ambiente no app (.env.local)
-- 2. Fazer deploy via Expo EAS Build
-- 3. Testar autenticação e RLS em ambiente de desenvolvimento
