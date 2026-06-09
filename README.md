# GasFlow — Frontend

Interface web do sistema **VaptGás**, plataforma multi-tenant de delivery de gás com quatro perfis de usuário: **cliente**, **motorista**, **admin de revendedora** e **master**.

Construído com TanStack Start (React 19 + SSR), TypeScript 5.8 strict e Tailwind CSS v4. Deploy via Cloudflare Workers.

---

## Tecnologias

| Camada          | Tecnologia                                                    |
| --------------- | ------------------------------------------------------------- |
| Framework       | [TanStack Start](https://tanstack.com/start) (React 19 + SSR) |
| Roteamento      | TanStack Router v1 (file-based)                               |
| Data fetching   | TanStack Query v5 (`useQuery`, `refetchInterval`)             |
| Estilização     | Tailwind CSS v4 + shadcn/ui + Radix UI                        |
| Mapas           | Leaflet 1.9 + OpenStreetMap / OSRM (importação dinâmica)      |
| Geocodificação  | Nominatim (gratuito, sem chave)                               |
| Validação       | Zod v4 (formulários de cadastro e perfil)                     |
| Observabilidade | Sentry (opcional via `VITE_SENTRY_DSN`) + Web Vitals          |
| Build           | Vite 7 + `@cloudflare/vite-plugin`                            |
| Deploy          | Cloudflare Workers (`wrangler`)                               |

---

## Pré-requisitos

- Node.js 20+
- API REST rodando em `http://localhost:3001` (ver [Contrato da API](#contrato-da-api))

---

## Configuração

Crie um arquivo `.env` na raiz:

```env
# URL da API acessível pelo browser (pública em produção)
VITE_API_URL="http://localhost:3001"

# URL da API para uso server-side (SSR / server functions)
API_URL="http://localhost:3001"

# Chave para chamadas M2M internas (opcional)
API_SECRET_KEY=""

# DSN do Sentry para captura de erros em produção (deixe vazio para desativar)
VITE_SENTRY_DSN=""
```

> Sem `VITE_SENTRY_DSN`, o Sentry não é inicializado e não há overhead na aplicação.

---

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:3000
```

A API Node.js precisa estar rodando em paralelo em `http://localhost:3001`.

---

## Scripts

```bash
npm run dev        # servidor de desenvolvimento com HMR
npm run build      # build de produção (Cloudflare Workers)
npm run build:dev  # build no modo development
npm run preview    # preview do build local
npm run lint       # ESLint
npm run format     # Prettier
```

---

## Estrutura de pastas

```
src/
├── auth/
│   └── AuthProvider.tsx          # contexto de autenticação (httpOnly cookie)
├── components/
│   ├── ui/                       # primitivos shadcn/ui (Button, Input, Card…)
│   ├── customer/                 # componentes exclusivos do cliente
│   │   ├── AddressDrawer.tsx     # drawer de endereço manual + mapa
│   │   ├── OrderDialog.tsx       # dialog de criação de pedido
│   │   ├── OrderStatusSteps.tsx  # linha do tempo de status do pedido
│   │   ├── DriverDetailsDrawer.tsx
│   │   ├── OrderRatingDrawer.tsx
│   │   └── OrderTrackingMapDrawer.tsx
│   ├── driver/                   # componentes exclusivos do motorista
│   │   ├── ActiveOrderCard.tsx
│   │   ├── PendingOrdersSection.tsx
│   │   ├── DriverDashboardCards.tsx
│   │   ├── DeliveryCompleteDialog.tsx
│   │   └── DeliveryRatingDrawer.tsx
│   ├── rating/                   # RatingCard, RatingForm
│   ├── DashboardLayout.tsx       # shell revendedora/master (sidebar + bottom nav)
│   ├── DriverLayout.tsx          # shell motorista (header + bottom nav)
│   └── …
├── hooks/
│   ├── useGeolocation.ts         # GPS com erros diferenciados (denied/timeout/unavailable)
│   ├── useDriverLocation.ts      # watchPosition + throttle de envio ao servidor
│   ├── useLeafletMap.ts          # inicialização lazy do Leaflet (evita SSR)
│   ├── useNearbyResellers.ts     # lista de revendedoras com infinite scroll
│   └── useTheme.ts
├── integrations/
│   └── api/
│       ├── client.ts             # cliente HTTP browser (httpOnly cookie automático)
│       └── client.server.ts      # cliente HTTP server-side (server functions)
├── lib/
│   ├── constants.ts              # fmtMoney, payLabel, SPEED_KMH, NOMINATIM_HEADERS
│   ├── cpf.ts                    # formatCpf, isValidCpf
│   ├── distance.ts               # haversineKm, estimateEtaMinutes, formatEta, formatKm
│   ├── sentry.ts                 # initSentry (gated por VITE_SENTRY_DSN)
│   └── vitals.ts                 # reportWebVitals (CLS, FCP, LCP, TTFB, INP)
├── routes/                       # páginas (file-based routing)
│   ├── __root.tsx                # QueryClient, AuthProvider, Sentry ErrorBoundary
│   ├── index.tsx                 # landing page
│   ├── login.tsx
│   ├── reset-password.tsx
│   ├── app.*                     # painel admin de revendedora
│   ├── customer.*                # painel do cliente
│   ├── driver.*                  # painel do motorista
│   └── master.*                  # painel master
├── services/
│   ├── customer.service.ts       # chamadas de API específicas do cliente
│   ├── driver.service.ts         # chamadas de API específicas do motorista
│   ├── order.service.ts          # criação e listagem de pedidos
│   └── reseller.service.ts       # produtos e revendedoras próximas
└── types/
    └── api.ts                    # tipos compartilhados (OrderRow, DriverRow, FullOrder…)
```

---

## Perfis e rotas

| Prefixo       | Perfil            | Telas principais                                      |
| ------------- | ----------------- | ----------------------------------------------------- |
| `/customer/*` | Cliente           | Home (mapa + pedido), rastreamento, histórico, perfil |
| `/driver/*`   | Motorista         | Dashboard operacional (GPS, fila, entrega), histórico |
| `/app/*`      | Admin revendedora | Pedidos, produtos, motoristas, dashboard              |
| `/master/*`   | Master            | Revendedoras, usuários, pedidos globais, estatísticas |

O redirecionamento pós-login é feito pelo `AuthProvider` com base no `role` retornado pela API.

---

## Autenticação

- A sessão é gerenciada por **httpOnly cookie** definido pelo servidor — nenhum token fica exposto ao JavaScript.
- No carregamento, `AuthProvider` valida a sessão via `GET /auth/me` (envia o cookie automaticamente).
- Chamadas browser-side usam `credentials: "include"` para enviar o cookie em todos os requests.
- Chamadas server-side (TanStack server functions) recebem o cookie no header e o repassam à API.
- Login bem-sucedido redireciona para a rota raiz do perfil; logout limpa a sessão no servidor.

---

## Polling e tempo real

O rastreamento de pedidos e a fila do motorista usam **TanStack Query com `refetchInterval`** (sem setInterval manual):

| Tela                   | Intervalo | Para de atualizar quando |
| ---------------------- | --------- | ------------------------ |
| Cliente — rastreamento | 10 s      | Componente desmontado    |
| Motorista — dashboard  | 15 s      | Componente desmontado    |

GPS do motorista usa `navigator.geolocation.watchPosition` com throttle de 10 s para envio ao servidor. Após 3 falhas consecutivas de GPS, o motorista é alertado via toast.

---

## Mapas

O Leaflet é sempre importado dinamicamente (`import("leaflet")`) para evitar erros de SSR. O hook `useLeafletMap` centraliza a inicialização, os refs de marcadores e a limpeza ao desmontar.

---

## Validação de formulários

Formulários críticos usam **Zod** para validação antes do envio, com mensagens de erro inline e `aria-invalid`:

| Formulário            | Campos validados                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Cadastro de motorista | Nome (≥ 3 chars), telefone (DDD+número), CPF, senha (≥ 6 chars), placa (ABC-1234 / ABC-1D23), tipo de veículo |
| Perfil do motorista   | Telefone, URL da foto de perfil                                                                               |
| Perfil do cliente     | Nome (≥ 2 chars), telefone                                                                                    |

---

## Contrato da API

O frontend consome uma API REST em `VITE_API_URL`. Todos os endpoints autenticados dependem do cookie de sessão (enviado automaticamente).

### Auth

```
POST   /auth/login                   { identifier, password }
GET    /auth/me
POST   /auth/logout
POST   /auth/reset-password          { token, password }
POST   /auth/change-password         { currentPassword, newPassword }
```

### Clientes

```
GET    /customers/me/profile
PATCH  /customers/me/profile         { fullName, phone }
GET    /customers/me/orders?limit=&offset=
GET    /customers/me/active-order
GET    /customers/me/last-delivery-address
GET    /customers/me/blocked-drivers
DELETE /customers/me/blocked-drivers/:driverId
POST   /customers/me/ratings         { orderIds }
POST   /customers/me/driver-metrics  { orderIds }
```

### Pedidos

```
POST   /orders                       { resellerId, productId, quantity, unitPrice, … }
GET    /orders/:id/tracking
GET    /orders/:id/detail
POST   /orders/:id/accept
POST   /orders/:id/start-delivery
POST   /orders/:id/complete          { code }
POST   /orders/:id/cancel
POST   /orders/:id/cancel-by-driver
POST   /orders/:id/reject-driver     { reason? }
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
DELETE /drivers/:id
GET    /drivers/:id/history
```

### Revendedoras

```
GET    /resellers/nearby?lat=&lng=&radius=
GET    /resellers/:id
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
GET    /admin/resellers
POST   /admin/resellers              { name, phone, email, adminFullName, … }
PATCH  /admin/resellers/:id
DELETE /admin/resellers/:id
GET    /admin/users
POST   /admin/users/:id/roles        { role }
DELETE /admin/users/:id/roles/:role
POST   /admin/users/:id/reseller-link { resellerId, role }
```

---

## Deploy (Cloudflare Workers)

```bash
npm run build
npx wrangler deploy
```

Configure as variáveis como **secrets** no painel do Cloudflare ou via CLI:

```bash
npx wrangler secret put VITE_API_URL
npx wrangler secret put API_URL
npx wrangler secret put API_SECRET_KEY
npx wrangler secret put VITE_SENTRY_DSN   # opcional
```

> Em produção, `VITE_API_URL` e `API_URL` devem apontar para a URL pública da API (ex: `https://api.seudominio.com`).
