# Paróquia Conectada

![Expo SDK 51](https://img.shields.io/badge/Expo-SDK%2051-000020?logo=expo&logoColor=white)
![React Native 0.74](https://img.shields.io/badge/React%20Native-0.74-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

[🇧🇷 Português](#português) · [🇺🇸 English](#english)

<a id="português"></a>

Aplicativo mobile para aproximar a comunidade da vida paroquial: horários de celebrações, liturgia diária, notícias, pedidos de oração e informações de dízimo em uma interface com cinco abas.

**Status:** em desenvolvimento. A presença de telas e serviços no código não representa homologação em dispositivos ou disponibilidade em produção.

## Demonstração

O repositório ainda não inclui vídeo, screenshots ou endereço de demonstração. A avaliação local depende da configuração do Supabase e dos ajustes de ambiente descritos abaixo.

## Funcionalidades

| Módulo | Recursos presentes no código |
| --- | --- |
| Celebrações | Consulta de horários, filtros por dia e tipo, próxima celebração e suporte a lembretes locais |
| Liturgia | Leitura por data, ajuste de fonte, cor litúrgica e cache local |
| Notícias | Feed, categorias, busca, compartilhamento e serviços de interação |
| Orações | Mural de intenções, formulário de pedido, opção de privacidade, apoio e vela virtual |
| Dízimo | Informações paroquiais, cópia da chave, valores sugeridos e modal de QR Code |
| Autenticação | Telas de login e cadastro com e-mail/senha, integração Supabase e persistência de sessão |

Login, cadastro, modais e hooks já estão presentes. A versão anterior deste README os listava como pendentes.

## Stack

React 18.2 · React Native 0.74.5 · Expo SDK 51 · Expo Router 3.5 · TypeScript 5.3 · NativeWind 2 · Tailwind CSS 3 · Supabase JS 2 · AsyncStorage · Lucide React Native.

As versões declaradas e os comandos estão em [package.json](package.json).

## Arquitetura

| Caminho | Responsabilidade |
| --- | --- |
| `app/(tabs)/` | Telas de celebrações, liturgia, notícias, orações e dízimo |
| `app/(auth)/` | Login, cadastro e layout de autenticação |
| `app/modals/` | Novo pedido de oração e visualização do QR Code |
| `app/_layout.tsx` | Layout raiz e integração de navegação |
| `src/components/` | Cards, leitor de liturgia, itens de oração e botão PIX |
| `src/hooks/` | Estado e acesso aos fluxos de autenticação, missas, liturgia, notícias e orações |
| `src/services/` | Operações de dados e funções dos módulos |
| `src/lib/supabase.ts` | Cliente Supabase, persistência de sessão e cache |
| `src/types/database.types.ts` | Tipos do banco |
| `supabase-schema.sql` | Tabelas, políticas RLS, triggers e dados iniciais |

As telas utilizam hooks e serviços para acessar o Supabase. O AsyncStorage mantém a sessão e caches de liturgia/notícias; isso não equivale a suporte offline completo.

Consulte também [ARCHITECTURE.md](ARCHITECTURE.md), documento de referência que pode conter planos além da implementação atual.

## Rodando localmente

### Pré-requisitos

- Node.js e npm compatíveis com as dependências do Expo SDK 51. O projeto não fixa uma versão de Node em `engines`.
- Projeto Supabase para desenvolvimento.
- Ambiente Android/iOS ou cliente de desenvolvimento compatível com o SDK utilizado.
- Para simulador iOS, macOS e Xcode.

### Instalação

```bash
git clone https://github.com/renanfrontend/paroquia-app.git
cd paroquia-app
npm install
cp .env.example .env.local
```

No PowerShell, use `Copy-Item .env.example .env.local` para copiar o arquivo.

### Ambiente

Configure as variáveis consumidas pelo cliente em `.env.local`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-anon
```

A chave pública depende das permissões do banco. O exemplo também menciona `SUPABASE_SERVICE_ROLE_KEY`, mas ela não é necessária para o aplicativo: mantenha credenciais privilegiadas exclusivamente no ambiente servidor, fora do bundle mobile.

### Banco de dados

1. Em um projeto Supabase de desenvolvimento, execute [supabase-schema.sql](supabase-schema.sql) no SQL Editor.
2. O script já habilita RLS e cria políticas; revise-as conforme os perfis de acesso desejados.
3. Substitua os dados iniciais pelos dados da paróquia, incluindo horários e informações de dízimo.
4. Configure o fluxo de confirmação de e-mail do Supabase Auth e valide cadastro/login.

O SQL cria tipos e tabelas e não é uma migração idempotente: não o reaplique indiscriminadamente em um banco existente.

### Desenvolvimento

```bash
npm start
```

Use os atalhos do Expo para o ambiente configurado. A CLI do Expo é fornecida pela dependência local; não é necessário instalar o antigo `expo-cli` global.

## Comandos

| Script | Finalidade |
| --- | --- |
| `npm start` | Iniciar o servidor Expo |
| `npm run android` | Iniciar Expo para Android |
| `npm run ios` | Iniciar Expo para iOS |
| `npm run web` | Iniciar o alvo web; requer completar e validar a configuração web |
| `npm run type-check` | Verificar tipos sem emitir arquivos |
| `npm run lint` | Executar ESLint; a configuração não está versionada |
| `npm run prebuild` | Gerar novamente os projetos nativos com `expo prebuild --clean`; pode substituir alterações nativas manuais |
| `npm run build:android` | Solicitar build Android via EAS |
| `npm run build:ios` | Solicitar build iOS via EAS |

Os scripts EAS exigem CLI disponível, conta/projeto configurados e configuração de build. O repositório ainda não inclui `eas.json`.

## Verificação e limites atuais

Esta documentação foi conferida com os arquivos do repositório; não certifica execução, build ou integração com um Supabase real.

- Não há workflow de CI, suíte de testes ou lockfile versionados.
- `app.json` referencia imagens em `assets/`, mas essa pasta não está presente na árvore atual.
- A configuração de ESLint e os arquivos de configuração Babel/Metro não estão versionados; a integração de estilos e execução precisa ser validada.
- O gerador de payload PIX está explicitamente simplificado em `src/services/pixService.ts`; o QR Code não deve ser apresentado como cobrança homologada. Não há confirmação bancária de pagamento.
- A opção de oração privada existe na interface, mas o acesso de autor e responsáveis deve ser conferido nas políticas RLS. O schema não define um papel específico de padre.
- Persistência de sessão utiliza AsyncStorage. Tipagem TypeScript não substitui autorização no banco.
- Não há publicação em lojas ou deploy automatizado documentados no repositório.

## Próximos passos

- Completar os assets e a configuração de execução/build.
- Validar tipos, lint e fluxos em dispositivos.
- Revisar permissões por perfil e pedidos privados.
- Substituir o gerador simplificado de PIX e validar o fluxo de contribuição.
- Adicionar testes, CI e demonstração visual.
- Avaliar tema escuro, paginação e autenticação social como evoluções futuras.

## Autoria

Projeto mantido no GitHub de **Renan Augusto dos Santos**.

[Portfólio](https://renanaugusto.com.br) · [GitHub](https://github.com/renanfrontend)

## Licença e direitos autorais

O README anterior declara: **“Propriedade de Tupysa / Paróquia [Nome]. Uso interno.”**

Essa indicação foi preservada; o repositório não contém arquivo `LICENSE`. A identificação definitiva do titular e da paróquia permanece pendente. Esta padronização documental não altera os termos de uso existentes. Dependências de terceiros mantêm suas respectivas licenças.

---

<a id="english"></a>

## 🇺🇸 English

**Paróquia Conectada** is a parish community mobile app built with React Native, Expo Router, TypeScript and Supabase. Its source includes celebration schedules, daily liturgy, news, prayer requests, tithe information, and email/password authentication.

### Architecture and setup

Routes live in `app/`; reusable UI, hooks, services and database types live in `src/`. Supabase handles data and authentication, while AsyncStorage persists sessions and selected cached content.

Clone the repository, run `npm install`, copy `.env.example` to `.env.local`, and set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Apply `supabase-schema.sql` to a development Supabase project, review its access policies and replace seed data. The SQL is not an idempotent migration. Keep service-role credentials server-side.

Run `npm start` with an environment compatible with Expo SDK 51. Available scripts are listed above; `npm run type-check` and `npm run lint` are the declared static checks.

### Current status

This is a work in progress, not a verified production release. Referenced image assets, ESLint configuration and EAS build configuration are missing from the current repository. No automated tests, CI workflow, lockfile or public demo are included. Runtime, builds and live backend integration were not validated during this documentation update.

The PIX payload generator is a simplified implementation, not a validated payment flow. Private prayer access requires policy review. Local caches do not provide full offline support.

Maintained in **Renan Augusto dos Santos**' GitHub account. The previous ownership notice (“Propriedade de Tupysa / Paróquia [Nome]. Uso interno.”) remains unchanged; no standalone license file is included.
