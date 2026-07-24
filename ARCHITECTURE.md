# Arquitetura - Paróquia Conectada

## 🏗️ Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    EXPO ROUTER V3                            │
│  Navigation (Tabs + Modals + Auth Screens)                   │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│                    COMPONENTS LAYER                          │
│  MassScheduleCard │ PrayerItem │ NewsCard │ etc              │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│                   SERVICES LAYER                             │
│  massService │ liturgyService │ newsService │ etc            │
│  (Data Access + Business Logic)                              │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│                   SUPABASE CLIENT                            │
│  PostgreSQL │ Auth │ RealtimeSubscriptions │ RLS             │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│              OFFLINE CACHE (AsyncStorage)                   │
│  Liturgia Diária │ News Posts Cache                          │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Camadas & Responsabilidades

### 1. **Navigation Layer** (`app/`)
- **Root Layout** (`_layout.tsx`): Gerencia autenticação global, redirecionamento
- **Tabs Layout** (`(tabs)/_layout.tsx`): Define 5 abas principais
- **Screen Components**: Telas de conteúdo (missas, liturgia, notícias, orações, dízimo)
- **Modals** (pending): Forms e expanded views

**Decisão:** Expo Router v3 oferece file-based routing tipo Next.js, simplificando navegação complexa.

### 2. **Presentation Layer** (`src/components/`)
Componentes reutilizáveis, stateless o máximo possível:

| Componente | Props | Responsabilidade |
|---|---|---|
| `MassScheduleCard` | schedule, isUpcoming | Display + lembrete local |
| `PrayerItem` | prayer, onUpdate | Display + interação (rezar, vela) |
| `NewsCard` | news, onLike | Display + like + compartilhar |
| `LiturgyReader` | liturgy | Leitor c/ zoom + cor litúrgica |
| `PixCopyButton` | pixKey, type, parish | Display chave + copy |

**Princípio:** Componentes "burros", lógica nos services.

### 3. **Business Logic Layer** (`src/services/`)
Orquestra queries ao Supabase, gerencia estado de dados:

```typescript
// massService.ts
getUpcomingMass() // Lógica: hoje + horário > agora, senão próximos dias
getMassesByDay() // Filtro + order
subscribeToMasses() // Real-time listener

// liturgyService.ts
getLiturgyOfDay() // Busca + cache offline fallback
preCacheLiturgy() // Background pre-cache 7 dias

// prayerService.ts
recordPrayerSupport() // Insert + atualiza contador
subscribeToNewPrayers() // Real-time
```

**Decisão:** Services centralizam regras de negócio, facilitam testes.

### 4. **Data Access Layer** (`src/lib/supabase.ts`)
- Cliente Supabase configurado
- Cache manager para offline
- RPC helpers (futuros)

### 5. **Offline Cache** (AsyncStorage)
Fallback quando sem internet:
```typescript
// Cache liturgia diária
cacheManager.cacheLiturgy(date, data)
const cached = await cacheManager.getCachedLiturgy(date)

// Cache notícias
cacheManager.cacheNewsPosts(data)
```

**Estratégia:** Buscar online sempre; se falhar, devolver cache.

---

## 🔐 Autenticação & Segurança

### Auth Flow
```
1. Usuário novo → register.tsx → Supabase Auth signup
2. handle_new_user trigger → cria row em profiles (MEMBER role)
3. Login → Supabase Auth → JWT armazenado em AsyncStorage
4. RLS policies validam JWT em cada query

5. Logout → Remove JWT + redirect para login
```

### Row Level Security (RLS)
Cada tabela tem policies:

```sql
-- Exemplo: Notícias
SELECT: público (true)
INSERT: role IN (ADMIN_PARISH, PASTORAL_LEADER)
UPDATE: role = ADMIN_PARISH
DELETE: role = ADMIN_PARISH

-- Exemplo: Orações
SELECT: 
  - Públicas aprovadas (qualquer um)
  - Privadas (só autor + admin)
INSERT: qualquer um autenticado
UPDATE: qualquer um (contadores)
```

**Duas camadas de segurança:**
1. TypeScript types (compile-time)
2. Supabase RLS (runtime)

---

## 📡 Real-Time & Synchronization

### Supabase Realtime Subscriptions
```typescript
// Nova oração chega
prayerService.subscribeToNewPrayers((prayer) => {
  setPrayers(prev => [prayer, ...prev])
})

// Contador de rezas atualiza
prayerService.subscribeToCounterUpdates(prayerId, (updatedPrayer) => {
  // UI re-renderiza
})
```

**Caso de Uso:** Múltiplos usuários rezando simultaneamente veem contadores atualizarem em tempo real.

### Offline Handling
```typescript
try {
  const data = await supabase.from('daily_liturgy').select()
  cacheManager.cacheLiturgy(date, data)
} catch (err) {
  const cached = await cacheManager.getCachedLiturgy(date)
  if (cached) return cached // fallback
}
```

---

## 🎯 Fluxos de Dados

### Fluxo: Horários de Missas
```
User abre tela → useEffect() chama massService.getAllMasses()
  ↓
massService faz query Supabase (filtro is_active = true)
  ↓
Retorna [MassSchedule]
  ↓
Estado local: setMasses(data)
  ↓
Map MassScheduleCard component para cada massa
  ↓
Usuário clica "Agendar Lembrete"
  ↓
Expo Notifications.scheduleNotificationAsync()
  ↓
Sistema notifica em 30min
```

### Fluxo: Novo Pedido de Oração
```
User abre modal novo-pedido-oracao (form)
  ↓
Preenche: autor_name, intention, category, is_private
  ↓
Clica submit
  ↓
prayerService.createPrayerRequest(payload)
  ↓
Supabase INSERT into prayer_requests
  ↓
Real-time listener dispara
  ↓
Todos os usuários em oracoes.tsx veem nova oração aparecer
```

### Fluxo: Acender Vela
```
User clica botão "Acender Vela" no PrayerItem
  ↓
handleLightCandle() → prayerService.lightCandle(prayerId)
  ↓
UPDATE prayer_requests SET candles_lit = candles_lit + 1
  ↓
Real-time subscription notifica
  ↓
Contador atualiza no UI (+1 vela)
```

---

## 🎨 Design Patterns

### 1. **Container/Presentational**
- **Containers** (screens): Gerenciam state + data fetching
- **Presentational** (components): Recebem props, renderizam apenas

### 2. **Service Pattern**
Cada domínio (mass, liturgy, prayer, news, pix) tem seu service:
```typescript
export const massService = {
  getAllMasses(),
  getMassesByDay(),
  getUpcomingMass(),
  // ...
}
```

### 3. **Observable Pattern** (Supabase Realtime)
```typescript
const unsubscribe = prayerService.subscribeToNewPrayers(onInsert, onError)
// ...
return () => unsubscribe() // cleanup
```

### 4. **Cache-Aside**
```
buscar(key) {
  try {
    dados = fetch(key) // online
    cache.set(key, dados)
    return dados
  } catch {
    return cache.get(key) // offline
  }
}
```

---

## 📊 State Management

### Global State
- **Autenticação**: Supabase auth (persistida em AsyncStorage)
- **Usuário**: RLS automático valida permissões

### Local State (React Hooks)
- Dados de lista: `useState([MassSchedule])`
- Filtros/busca: `useState(selectedCategory)`
- Loading/error: `useState(isLoading)`, `useState(error)`

**Não usamos Redux/Zustand:** O Supabase RealTime + AsyncStorage + React hooks são suficientes para este escopo.

---

## ⚡ Performance

### Otimizações Implementadas

1. **Índices no Banco**
```sql
CREATE INDEX idx_mass_day_location ON mass_schedules(day_of_week, location)
CREATE INDEX idx_liturgy_date ON daily_liturgy(date)
CREATE INDEX idx_prayer_public ON prayer_requests(created_at DESC) 
  WHERE is_private = FALSE AND is_approved = TRUE
```

2. **Limit de Queries**
```typescript
getAllNews(limit: number = 50) // Sempre paginar
getPrayers(limit: number = 20) // Top 20 sempre
```

3. **Cache Offline**
Liturgia e notícias pre-cacheadas para 7 dias.

4. **Lazy Loading**
Screens só carregam quando ativa (useFocusEffect).

### Benchmarks Esperados
- Home load: < 1.5s
- Scroll smooth: 60 FPS
- Notificação: < 30ms trigger

---

## 🧪 Testing Strategy (TODO)

```typescript
// __tests__/services/massService.test.ts
describe('massService', () => {
  test('getUpcomingMass returns next mass', async () => {
    // Mock Supabase
    // Assert resultado
  })
})

// __tests__/components/MassScheduleCard.test.tsx
describe('MassScheduleCard', () => {
  test('renders mass time and location', () => {
    // Render component
    // Check display
  })
})
```

---

## 🚀 Deployment Checklist

- [ ] Testar RLS policies completo
- [ ] Configurar variáveis de ambiente (.env.local)
- [ ] Pre-cache liturgia 30 dias
- [ ] Testar notificações em Android/iOS
- [ ] Configurar push notifications backend
- [ ] Load testing (simulate 1000 users)
- [ ] Build EAS (iOS + Android)
- [ ] Privacy policy + terms
- [ ] Monitor de performance (Sentry, etc)

---

## 📚 Referências

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Arquiteto:** Senior Frontend Engineer | **Data:** 2024 | **Status:** Beta
