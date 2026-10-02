# VaptGás — Frontend

Interface web do **VaptGás**, plataforma multi-tenant de delivery de gás com quatro perfis de usuário: **cliente**, **motorista**, **admin de revendedora** e **master**.

Construído com TanStack Start (React 19 + SSR), TypeScript strict e Tailwind CSS v4.

> **Status da API:** o backend implementa por enquanto apenas cadastro, autenticação (login/logout/sessão), troca de senha e atualização de perfil. Os demais endpoints listados em [Contrato da API](#contrato-da-api) (pedidos, motoristas, revendedoras, admin, avaliações, endereços…) ainda estão em desenvolvimento e o contrato é **provisório**.

---

## Tecnologias

| Camada          | Tecnologia                                                    |
| --------------- | ------------------------------------------------------------- |
| Framework       | [TanStack Start](https://tanstack.com/start) (React 19 + SSR) |
| Roteamento      | TanStack Router v1 (file-based)                               |
| Data fetching   | TanStack Query v5 (hooks em `src/queries`)                    |
| Estilização     | Tailwind CSS v4 + shadcn/ui + Radix UI + Vaul (drawers)       |
| Mapas e rotas   | Leaflet 1.9 + OpenStreetMap / OSRM (importação dinâmica)      |
| Geocodificação  | Nominatim (endereço ↔ coordenadas) + ViaCEP (busca por CEP)   |
| Validação       | Zod v4 (formulários e variáveis de ambiente)                  |
| Notificações    | Sonner (toasts)                                               |
| Observabilidade | Sentry (opcional via `VITE_SENTRY_DSN`) + Web Vitals          |
| Build           | Vite 7                                                        |

---

## Pré-requisitos

- Node.js 20+
- API REST rodando em `http://localhost:3001` (ver [Contrato da API](#contrato-da-api))

---

## Configuração

Copie o arquivo de exemplo e ajuste os valores:

```bash
cp .env.example .env
```

```env
# URL da API acessível pelo browser (pública em produção)
VITE_API_URL="http://localhost:3001"

# URL pública deste front, usada no og:image das prévias em redes sociais (opcional)
VITE_SITE_URL=""

# DSN do Sentry para captura de erros em produção (deixe vazio para desativar)
VITE_SENTRY_DSN=""
```

As variáveis são validadas com Zod em `src/lib/env.schema.ts` já no `vite dev` / `vite build`: se `VITE_API_URL` estiver ausente ou não for uma URL `http(s)`, o comando falha na hora. Valores vazios contam como "não definido".

> Sem `VITE_SENTRY_DSN`, o Sentry não é inicializado e não há overhead na aplicação.

---

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:8080
```

A API precisa estar rodando em paralelo em `http://localhost:3001`.

---

## Scripts

```bash
npm run dev          # servidor de desenvolvimento com HMR
npm run build        # build de produção (dist/client + dist/server)
npm run build:dev    # build no modo development
npm run preview      # preview do build local
npm run lint         # ESLint
npm run typecheck    # checagem de tipos (tsc --noEmit)
npm run format       # formata com Prettier
npm run format:check # só verifica a formatação (para CI)
```

> Ainda não há testes automatizados nem pipeline de CI configurados.

---

## Estrutura de pastas

```
src/
├── auth/
│   ├── AuthProvider.tsx          # contexto de autenticação (signIn, signOut, roles)
│   ├── session.ts                # query da sessão (GET /auth/me), compartilhada com os guards
│   ├── guard.ts                  # requireRole(): beforeLoad que protege cada área
│   └── roles.ts                  # homePathForRoles, canAccessArea
├── components/
│   ├── ui/                       # primitivos shadcn/ui (Button, Input, Drawer…)
│   ├── address/                  # campos de endereço, autocomplete, seletor no mapa
│   ├── admin/                    # telas do master (revendedoras, credenciais)
│   ├── auth/                     # ChangePasswordDialog
│   ├── common/                   # ErrorFallback, LoadError, FullScreenLoader, useConfirm
│   ├── customer/                 # componentes do cliente (pedido, rastreamento, perfil…)
│   ├── driver/                   # componentes do motorista (pedido ativo, fila, entrega…)
│   ├── layout/                   # DashboardLayout, DriverLayout, bottom navs, ThemeToggle
│   ├── login/                    # etapas do login (cliente, cadastro, equipe)
│   ├── order/                    # OrderStatusBadge
│   ├── rating/                   # RatingCard, RatingForm
│   └── reseller/                 # gestão de motoristas da revendedora
├── hooks/                        # geolocalização, mapas Leaflet, dashboard do motorista…
├── i18n/
│   └── ptBR.ts                   # rótulos de status, perfis e aprovação
├── integrations/
│   └── api/
│       └── client.ts             # cliente HTTP (cookie de sessão, CSRF, ApiError, timeout)
├── lib/
│   ├── env.schema.ts / env.ts    # validação das variáveis VITE_*
│   ├── validation.ts             # schemas Zod reutilizáveis (CPF, telefone, placa)
│   ├── cpf.ts, phone.ts          # formatação e validação
│   ├── distance.ts               # haversine, ETA, formatação de distância
│   ├── order-status.ts           # helpers de status do pedido
│   ├── sentry.ts, vitals.ts      # observabilidade
│   └── …
├── queries/                      # hooks do TanStack Query por domínio
│   ├── keys.ts                   # fábricas de query keys
│   ├── client.ts                 # QueryClient (retry, staleTime)
│   ├── mutation.ts               # useInvalidatingMutation
│   └── *.queries.ts              # admin, auth, customer, driver, order, reseller
├── routes/                       # páginas (file-based routing)
│   ├── __root.tsx                # providers, Sentry ErrorBoundary, Web Vitals
│   ├── index.tsx                 # landing page
│   ├── login.tsx
│   ├── reset-password.tsx
│   ├── driver_.signup.tsx        # cadastro de motorista via convite (/driver/signup)
│   ├── app.*                     # painel admin de revendedora
│   ├── customer.*                # painel do cliente
│   ├── driver.*                  # painel do motorista
│   └── master.*                  # painel master
├── services/                     # chamadas à API e a serviços externos (geo.service.ts)
├── types/                        # tipos por domínio (auth, order, customer, driver…)
├── router.tsx / router-context.ts
└── styles.css
```

`src/routeTree.gen.ts` é gerado automaticamente pelo plugin do TanStack Router — não edite à mão.

---

## Perfis e rotas

| Prefixo       | Perfil            | Telas principais                                                             |
| ------------- | ----------------- | ---------------------------------------------------------------------------- |
| `/customer/*` | Cliente           | Home (mapa + pedido), rastreamento, histórico, motoristas bloqueados, perfil |
| `/driver/*`   | Motorista         | Dashboard operacional (GPS, fila, entrega), histórico de entregas, perfil    |
| `/app/*`      | Admin revendedora | Dashboard, pedidos, produtos, motoristas (convites, aprovação, histórico)    |
| `/master/*`   | Master            | Estatísticas, revendedoras, usuários, pedidos globais                        |

Rotas públicas: `/` (landing), `/login`, `/reset-password` e `/driver/signup?token=…` (cadastro de motorista por convite).

O perfil do cliente (`/customer/profile`) tem as subpáginas: dados pessoais, segurança (troca de senha), endereços, formas de pagamento, notificações, aparência e ajuda. **Pagamento, notificações e ajuda ainda são placeholders.**

---

## Autenticação

- A sessão é gerenciada por **httpOnly cookie** definido pela API — nenhum token fica exposto ao JavaScript.
- Todas as requisições usam `credentials: "include"`. Requisições que não são `GET` enviam o header `x-csrf-token` com o valor do cookie `csrf_token`, quando presente.
- A sessão vem de `GET /auth/me` e fica em cache no TanStack Query (`src/auth/session.ts`), lida tanto pelo `AuthProvider` quanto pelos guards de rota.
- Cada área (`/customer`, `/driver`, `/app`, `/master`) usa `requireRole()` no `beforeLoad`: sem sessão → `/login`; perfil errado → home do próprio perfil. Essas áreas rodam com `ssr: false`, pois o cookie pertence à origem da API e o servidor do front não consegue ler a sessão.
- Qualquer `401` fora do login/troca de senha é tratado como sessão expirada e desloga o usuário.
- Após o login, o usuário vai para a home do perfil mais privilegiado (master → revendedora → motorista → cliente). Usuários sem perfil caem na área do cliente.

### Fluxo de login

- **Cliente:** informa CPF e senha. O front consulta `POST /auth/check-cpf`; se o CPF não existir, abre o cadastro (`POST /auth/register`) e faz login em seguida.
- **Equipe** (motorista, revendedora, master): login com e-mail/identificador e senha.
- **Motorista novo:** só se cadastra por link de convite gerado pela revendedora.

---

## Polling e tempo real

Não há WebSocket; as telas ao vivo usam **TanStack Query com `refetchInterval`**:

| Tela                   | Intervalo | Para de atualizar quando                             |
| ---------------------- | --------- | ---------------------------------------------------- |
| Cliente — rastreamento | 10 s      | Pedido entregue, cancelado ou expirado / desmontagem |
| Motorista — dashboard  | 15 s      | Componente desmontado                                |

O GPS do motorista usa `navigator.geolocation.watchPosition` com envio ao servidor no máximo a cada 10 s. Falhas consecutivas de GPS geram alerta via toast.

Por padrão, queries ficam frescas por 30 s e erros 4xx não são re-tentados (`src/queries/client.ts`).

---

## Mapas e endereços

- O Leaflet é sempre importado dinamicamente (`import("leaflet")`) para evitar erros de SSR. Os hooks `useLeafletMap`, `usePickerMap` e `useTripMap` centralizam inicialização, marcadores e limpeza.
- `src/services/geo.service.ts` concentra as chamadas externas: Nominatim (busca e geocodificação reversa), ViaCEP (CEP → endereço) e OSRM (rota de carro entre dois pontos).
- Nenhum desses serviços exige chave, mas todos têm limites de uso público — em produção, considere instâncias próprias ou um proxy.

---

## Validação de formulários

Formulários usam **Zod** antes do envio, com mensagens inline e `aria-invalid`. Os schemas compartilhados ficam em `src/lib/validation.ts`.

| Formulário                    | Campos validados                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Cadastro de motorista         | Nome (≥ 3 chars), telefone (DDD+número), CPF, senha (≥ 6 chars), placa (ABC-1234 / ABC-1D23), tipo de veículo |
| Edição de motorista (revenda) | Nome, telefone, CPF e placa (opcionais)                                                                       |
| Perfil do motorista           | Telefone, URL da foto de perfil                                                                               |
| Perfil do cliente             | Nome, telefone                                                                                                |

---

## Contrato da API

O frontend consome uma API REST em `VITE_API_URL`. Endpoints autenticados dependem do cookie de sessão. Exceto pelo bloco **Auth** e pela atualização de perfil, o contrato abaixo é provisório.

### Auth ✅

```
POST   /auth/login                   { cpf, password } | { identifier, password }
GET    /auth/me                      → { user, roles, resellerId? }
POST   /auth/logout
POST   /auth/check-cpf               { cpf } → { exists }
POST   /auth/register                { cpf, name, email, phone?, password }
POST   /auth/change-password         { currentPassword, newPassword }
POST   /auth/reset-password          { token, password }
```

### Usuário / Cliente

```
PATCH  /users/me                     { fullName, phone }           ✅
GET    /customers/me/orders?limit=&offset=
GET    /customers/me/active-order
GET    /customers/me/last-delivery-address
GET    /customers/me/blocked-drivers
DELETE /customers/me/blocked-drivers/:driverId
POST   /customers/me/ratings         { orderIds }
POST   /customers/me/driver-metrics  { orderIds }
```

### Endereços do cliente

```
GET    /customer-addresses
GET    /customer-addresses/:id
POST   /customer-addresses           { street, number, complement, neighborhood, city, state, postalCode }
PATCH  /customer-addresses/:id       (campos parciais, ex.: { isDefault })
```

### Pedidos

```
POST   /orders                       { resellerId, productId, quantity, unitPrice, … }
GET    /orders/:id/tracking
GET    /orders/:id/detail
POST   /orders/:id/accept
PATCH  /orders/:id/status            { status }
POST   /orders/:id/deliver           { code }
POST   /orders/:id/complete          { code }
POST   /orders/:id/cancel            { reason? }
POST   /orders/:id/cancel-by-driver
POST   /orders/:id/reject-driver     { reason }
POST   /orders/:id/rating            { rating, comment, delivery_time_rating }
```

### Motoristas

```
GET    /drivers/me
GET    /drivers/me/active-order
GET    /drivers/me/pending-orders
GET    /drivers/me/dashboard
GET    /drivers/me/deliveries?limit=&offset=
GET    /drivers/me/profile
PATCH  /drivers/me/profile           { phone, avatarUrl, notes, additionalInfo }
PATCH  /drivers/me/location          { lat, lng }
PATCH  /drivers/me/status            { status }
POST   /drivers/me/customer-details  { orderIds }
PATCH  /drivers/:id                  { fullName, phone, … }
PATCH  /drivers/:id/status           { approvalStatus }
DELETE /drivers/:id?deleteAccount=
GET    /drivers/:id/history
```

### Revendedoras e produtos

```
GET    /resellers/nearby?lat=&lng=&radius=
GET    /resellers/:id/products
GET    /resellers/:id/drivers
GET    /resellers/:id/orders
GET    /resellers/:id/stats
POST   /resellers/:id/products       { name, description, price, … }
PATCH  /products/:id
DELETE /products/:id
```

### Convites (motoristas)

```
POST   /invites/driver
GET    /invites/driver/validate?token=
POST   /invites/driver/signup        { token, password, fullName, phone, document, vehiclePlate, vehicleType, vehicleModel? }
```

### Admin (master)

```
GET    /admin/stats
GET    /admin/orders?limit=
GET    /admin/resellers?active=
POST   /admin/resellers              { name, phone, email, adminFullName, … }
PATCH  /admin/resellers/:id
DELETE /admin/resellers/:id
GET    /admin/users
POST   /admin/users/:id/roles        { role }
DELETE /admin/users/:id/roles/:role
POST   /admin/users/:id/reseller-link { resellerId, role }
```

✅ = já implementado no backend.

---

## Deploy

`npm run build` gera `dist/client` (assets estáticos) e `dist/server/server.js`, que exporta um handler `fetch` padrão do TanStack Start. Ainda **não há um alvo de deploy configurado**. Para publicar, configure um adaptador (ex.: `@cloudflare/vite-plugin` + `wrangler`, ou Nitro para Node/Vercel/Netlify).

As variáveis `VITE_*` são embutidas no bundle **no momento do build**, então precisam estar definidas no ambiente em que `npm run build` roda.

> Em produção, `VITE_API_URL` deve apontar para a URL pública da API (ex: `https://api.seudominio.com`). Como a sessão usa cookie, a API precisa liberar CORS com `credentials` para a origem do front e configurar `SameSite`/`Secure` adequadamente se estiverem em domínios diferentes.
