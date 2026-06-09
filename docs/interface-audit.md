# Auditoria de Interface (PWA VaptGás)

## 1) Mapeamento completo de telas por perfil

### Público / autenticação

- `/` — Landing page inicial.
- `/login` — Login.
- `/reset-password` — Redefinição de senha.
- `*` — 404 (notFound).

### Cliente

- `/customer` — Mapa + seleção de revendedora/produtos + criação de pedido.
- `/customer/orders` — Lista de pedidos do cliente.
- `/customer/order/$orderId` — Detalhe/track de pedido.
- `/customer/profile` — Perfil do cliente.

### Motorista

- `/driver` — Home operacional (fila, pedido ativo, mapa, ações de entrega).
- `/driver/deliveries` — Histórico/lista de entregas.
- `/driver/profile` — Perfil do motorista.
- `/driver/signup` — Cadastro/entrada inicial do motorista.

### Revendedora (reseller_admin)

- `/app` — Dashboard (resumo).
- `/app/orders` — Gestão de pedidos.
- `/app/products` — Gestão de produtos.
- `/app/drivers` — Gestão de motoristas.

### Master

- `/master` — Dashboard geral.
- `/master/resellers` — Gestão de revendedoras.
- `/master/users` — Gestão de usuários.
- `/master/orders` — Gestão global de pedidos.

---

## 2) Inconsistências encontradas

## 2.1 Layout

- **Cliente** usa layout simples com `CustomerBottomNav` fixo e conteúdo full width.
- **Motorista** mistura dois padrões simultâneos: `DriverNavigation` (sidebar desktop + wrapper) e `DriverBottomNav` injetado por página, sem layout raiz único em `/driver`.
- **Revendedora/Master** já usam padrão único via `DashboardLayout` com sidebar desktop + header e bottom nav mobile.

**Impacto**: experiência fragmentada no perfil motorista e maior custo de manutenção visual.

## 2.2 Navegação

- `DashboardLayout` (app/master) resolve ativo por igualdade exata de `pathname`, bom para rotas top-level.
- `CustomerBottomNav` já trata rotas filhas com `startsWith` (ex.: `/customer/orders/...`).
- `DriverBottomNav` e `DriverNavigation` usam apenas igualdade exata; em possíveis subrotas futuras o estado ativo quebra.
- Há **três implementações paralelas de navegação** (customer, driver, dashboard) com pequenas variações de espaçamento, tipografia e feedback ativo.

## 2.3 Componentes

- Botões e inputs base são padronizados via `src/components/ui/*` (base positiva).
- Porém, telas de motorista estão com JSX densamente inline (especialmente `/driver`) e padrões de cards/ações não extraídos em blocos reutilizáveis.
- Em perfil, cliente e motorista têm estruturas semelhantes (dados pessoais + segurança + logout) mas implementações diferentes e repetidas.

## 2.4 UX

- Falta um “shell” consistente por perfil (principalmente motorista).
- Área útil mobile pode variar por tela devido a estratégias diferentes de `pb-20/pb-24` para compensar navegação fixa.
- Fluxos críticos (pedidos e entrega) estão funcionais, mas hierarquia visual poderia ser mais previsível (mesmas regiões de ação primária por tela).

---

## 3) Padrões repetidos que devem virar reutilização

1. **Navegação por perfil**
   - Estrutura de itens (`to`, `label`, `icon`) repetida em customer/driver/app/master.
2. **Seções de perfil**
   - Cartões de “dados editáveis”, “segurança” e “logout” com mesma intenção.
3. **Estados de carregamento de página**
   - Várias telas implementam loader central de forma manual.
4. **Cards de pedidos/entregas**
   - Estruturas semelhantes com badge de status e valor/endereço.

---

## 4) Padrão global proposto (mobile-first)

## 4.1 Design System simplificado

### Cores

- Manter tokens atuais de `src/styles.css` como fonte única (`--primary`, `--secondary`, `--muted`, `--destructive`, etc.).
- Definir regra de uso:
  - Primária = ações principais.
  - Secundária = contexto institucional/dashboard.
  - Muted = superfícies de apoio.
  - Status = success/warning/destructive para estados de pedido.

### Tipografia

- Escala mínima comum:
  - `text-xs` metadados e labels auxiliares.
  - `text-sm` conteúdo de listas/cards.
  - `text-base` títulos de seção.
  - `text-lg` título de página.

### Espaçamento

- Padrão de página mobile: `p-4` + `space-y-4`.
- Padrão de desktop dashboard: `md:px-8 md:py-6`.
- Único token para compensar navegação fixa mobile (ex.: `pb-safe-nav`).

### Grid/Layout

- **Shell por perfil**:
  - Cliente: full-screen mapa + bottom sheet + bottom nav.
  - Motorista: shell próprio igual ao dashboard (header + bottom nav mobile, sidebar desktop).
  - Revendedora/Master: manter `DashboardLayout`.

## 4.2 Componentes padrão

- **Botão**: usar apenas variantes do `Button` (primary/outline/ghost/destructive) com tamanhos consistentes.
- **Input**: manter `Input` + `Label`; criar wrappers de campo para uniformizar espaçamento e hint/error.
- **Card**: adotar composição base (`CardHeader`, `CardContent`) para entidades de pedido, usuário, métricas.
- **Modal/Dialog/Drawer**: priorizar `Dialog` para confirmações e `Drawer` para fluxos mobile contextuais (cliente).
- **Listas**: padrão de item com ícone esquerdo, conteúdo central, estado à direita (badge/valor/CTA).

## 4.3 Navegação por perfil

- **Cliente**: manter bottom nav de 3 itens + foco no mapa/compra rápida.
- **Motorista**:
  - Mobile: bottom nav de 3 itens + header fixo leve.
  - Desktop: sidebar lateral.
  - Implementar via um único `DriverLayout` (equivalente ao `DashboardLayout`) para eliminar duplicação.
- **Revendedora/Master**: manter dashboard com sidebar desktop e bottom nav mobile (padrão já maduro).

---

## 5) Plano incremental de implementação (sem risco)

### Fase 0 — Baseline visual (baixo risco)

1. Inventário de componentes por tela (botões, cards, inputs, modais).
2. Criar guia curto de UI com exemplos reais (tokens + padrões de uso).

### Fase 1 — Padronização estrutural (baixo/médio risco)

1. Criar `DriverLayout` único e mover navegação motorista para esse shell.
2. Garantir uma estratégia única de espaçamento de conteúdo com navegação fixa mobile.
3. Padronizar títulos de página e áreas de ação primária.

### Fase 2 — Reuso de componentes (médio risco)

1. Extrair componentes compartilhados:
   - `ProfileSectionCard`
   - `OrderStatusBadge`
   - `PageLoader`
2. Substituir implementações locais sem alterar queries/mutations e regras de negócio.

### Fase 3 — Acabamento UX (médio risco)

1. Revisar hierarquia visual em telas de operação (driver/customer).
2. Padronizar feedback de loading/empty/error.
3. Validar consistência de navegação ativa em subrotas.

---

## 6) O que pode ser padronizado sem risco

- Layout containers, paddings, tipografia, espaçamento.
- Componentização de elementos visuais repetidos.
- Navegação visual (desde que rotas e permissões permaneçam iguais).
- Estados visuais de loading/empty/error.

## 7) O que exige cuidado

- Tela `/driver` e `/customer` (fluxos operacionais complexos com mapa, realtime e diálogos).
- Alterações em navegação fixa mobile (risco de sobrepor CTA/inputs).
- Qualquer refactor perto de autenticação/guardas de rota.

## 8) O que NÃO deve ser alterado

- Regras de negócio de pedidos, aceite, entrega, cancelamento e avaliação.
- Chamadas Supabase/RPC e contratos de server functions.
- Permissões/roteamento por papel de usuário.

---

## Conclusão

A base já possui tokens sólidos e componentes UI bons, porém a **consistência entre perfis ainda é desigual** (principalmente em motorista). O caminho recomendado é consolidar o shell por perfil e extrair padrões visuais repetidos de forma incremental, preservando 100% dos fluxos e lógica existentes.

## 9) Implementações aplicadas nesta rodada

- Criado `DriverLayout` para consolidar a estrutura visual comum do motorista (container, espaçamento e bottom nav), reduzindo duplicação em telas de perfil e entregas.
- `DriverBottomNav` e `DriverNavigation` agora tratam rotas filhas com `startsWith`, alinhando o comportamento de item ativo ao mesmo padrão já usado no cliente.
- As telas `/driver/deliveries` e `/driver/profile` foram migradas para o novo layout unificado sem alterar dados, queries, mutações ou regras de negócio.

### Próximos passos recomendados

1. Migrar também `/driver` (home operacional) para `DriverLayout` de forma incremental, validando mapa/realtime.
2. Criar `PageLoader` compartilhado e substituir loaders inline em todos os perfis.
3. Extrair `StatusBadge` para pedidos/entregas em cliente, motorista, revendedora e master.
