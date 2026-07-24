# Paróquia Conectada - React Native App

> Aplicativo mobile para digitalizar comunicação e engajamento paroquial (Expo Router v3, Supabase, TypeScript)

## 🚀 Setup Rápido

### 1. Pré-requisitos
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Conta Supabase (https://app.supabase.com)

### 2. Instalação
```bash
cd paroquia-app
npm install
# ou
pnpm install
```

### 3. Configurar Variáveis de Ambiente
```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase
```

### 4. Deploy do Schema no Supabase
1. Vá para SQL Editor no dashboard Supabase
2. Cole todo o conteúdo de `supabase-schema.sql` (fornecido no PRD)
3. Execute o script
4. Ative Row Level Security (RLS) nas tabelas

### 5. Iniciar Dev Server
```bash
npm start
```

- Android: Pressione `a`
- iOS: Pressione `i`
- Web: Pressione `w`

## 📁 Estrutura de Arquivos

```
app/
├── (tabs)/              # Navegação com abas principais
│   ├── _layout.tsx      # Tab bar com 5 abas
│   ├── index.tsx        # Horários de Missas
│   ├── liturgia.tsx     # Liturgia Diária
│   ├── noticias.tsx     # Mural de Notícias
│   ├── oracoes.tsx      # Pedidos de Oração
│   └── dizimo.tsx       # PIX e Dízimo
├── modals/              # [TODO] Modais
│   ├── novo-pedido-oracao.tsx
│   └── pix-qr-modal.tsx
├── login.tsx            # [TODO] Autenticação
├── register.tsx         # [TODO] Registro
├── _layout.tsx          # Root layout + providers
└── +not-found.tsx

src/
├── components/          # Componentes reutilizáveis
│   ├── MassScheduleCard.tsx
│   ├── PrayerItem.tsx
│   ├── LiturgyReader.tsx
│   ├── NewsCard.tsx
│   └── PixCopyButton.tsx
├── services/            # Data access layer (Supabase)
│   ├── massService.ts
│   ├── liturgyService.ts
│   ├── prayerService.ts
│   ├── newsService.ts
│   └── pixService.ts
├── lib/
│   └── supabase.ts      # Cliente Supabase + cache offline
├── types/
│   └── database.types.ts # Types gerados do Supabase
└── hooks/               # [TODO] Custom hooks
    ├── useAuth.ts
    ├── useLiturgy.ts
    └── useMasses.ts
```

## 🎯 Funcionalidades Implementadas

✅ **Horários de Celebrações**
- Listagem por dia da semana
- Filtro por tipo (Missa, Confissão, Adoração, Terço, Novena)
- Próxima missa em destaque
- Lembrete com notificação local (30 min antes)

✅ **Liturgia Diária**
- Leitor interativo com zoom de fonte
- Cache offline para leitura sem internet
- Navegação por datas
- Exibição de cor litúrgica do dia

✅ **Mural de Notícias**
- Feed com cards de notícias
- Filtro por categoria (Aviso, Evento, Pastoral, Festa, Catequese)
- Busca por palavras-chave
- Sistema de likes
- Compartilhamento no WhatsApp / Redes Sociais

✅ **Pedidos de Oração**
- Mural de intenções públicas
- Contador "Rezei por você" (interativo)
- Acender vela virtual
- Filtro por categoria e trending
- Orações confidenciais (somente padre)

✅ **Dízimo via PIX**
- Exibição de QR Code PIX
- Cópia da chave PIX (CNPJ / CPF)
- Valores sugeridos (R$ 20, 50, 100, 200)
- Informações paroquiais e contexto teológico
- Mensagem de agradecimento personalizada

## 📋 Próximas Implementações

### Modais [PENDING]
1. **novo-pedido-oracao.tsx**
   - Formulário com: Nome, Categoria, Intenção, Checkbox privado
   - Validação e submit
   - Loading state
   - Sucesso/erro toast

2. **pix-qr-modal.tsx**
   - QR Code grande (usa lib `qrcode.react` ou similiar)
   - Botão copiar chave
   - Botão compartilhar no WhatsApp

### Telas de Autenticação [PENDING]
1. **login.tsx**
   - Email/senha
   - Login com Google/Apple (via Supabase)
   - Link "Criar Conta"

2. **register.tsx**
   - Nome completo, email, senha
   - Validação
   - Termos de privacidade
   - Sucesso + redirecionamento

### Hooks Customizados [PENDING]
```typescript
useAuth() // Session, logout, user profile
useLiturgy() // Auto-sincronização com cache
useMasses() // Próxima missa + lembrete
usePrayers() // Real-time listener
useNews() // Cache + live updates
```

### Melhorias de UX [PENDING]
- Skeleton loaders durante fetch
- Infinite scroll / pagination
- Pull-to-refresh completo
- Modo escuro (dark mode)
- Animações de transição
- Toast notifications (Sonner ou similiar)

## 🔐 Segurança & RLS

Todas as queries passam por Row Level Security (RLS):

```sql
-- Leitura pública (missas, liturgia, notícias públicas)
-- Escrita: apenas admins e líderes pastorais
-- Orações privadas: somente padre + autor
```

**Princípio:** A tipagem forte do TypeScript + RLS no Supabase = segurança em duas camadas.

## 🎨 Design System

**Cores Primárias:**
- Vermelho: `#dc2626` (ação, destaque paroquial)
- Cinzas neutros: `#1f2937` → `#f3f4f6`
- Sucesso: `#10b981`
- Aviso: `#f59e0b`
- Erro: `#dc2626`

**Tipografia:**
- Headlines: System font bold
- Body: System sans-serif
- Monospace: Para chaves PIX

**Componentes:**
- Cards com shadow suave
- Botões com active states claros
- Ícones via lucide-react-native

## 📱 Build & Deploy

### EAS Build (Recomendado)
```bash
# Android
npm run build:android

# iOS
npm run build:ios
```

### Deploy Manual
```bash
# Prebuild nativo (se necessário)
npm run prebuild

# Compilar com Xcode (iOS) / Android Studio
```

## 🐛 Troubleshooting

**"Cannot find module '@/lib/supabase'"**
- Limpar cache: `rm -rf node_modules/.cache`
- Reinstalar: `npm install`

**Notificações não funcionam**
- Verificar `eas.json` config
- Testar com `expo-notifications` diretamente

**RLS causando erros 403**
- Verificar se o usuário tem permissão na policy
- Logar com usuário com role `ADMIN_PARISH` ou `PASTORAL_LEADER`

## 📚 Recursos

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [NativeWind (Tailwind para React Native)](https://www.nativewind.dev/)
- [Lucide Icons](https://lucide.dev/)

## 📄 Licença

Propriedade de Tupysa / Paróquia [Nome]. Uso interno.

---

**Arquiteto:** Senior Frontend Engineer
**Stack:** React Native, Expo Router v3, TypeScript, Supabase, Tailwind/NativeWind
**Status:** Beta 1.0 (Em Desenvolvimento)
