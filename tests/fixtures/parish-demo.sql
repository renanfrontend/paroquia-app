-- APENAS PARA TESTES LOCAIS. Não executar em produção.

-- ==============================================================================

-- Inserir uma paróquia exemplo
INSERT INTO public.tithe_info (parish_name, cnpj, pix_key, pix_key_type, city, bank_name, custom_message)
VALUES (
  'Paróquia Nossa Senhora das Graças',
  '12.345.678/0001-90',
  '123e4567-e89b-12d3-a456-426614174000',
  'ALEATORIA',
  'São Paulo',
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

