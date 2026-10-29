# Phase 1 Data Model: Tela de Início (Painel do Dia)

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Entidades de domínio (já existentes, sem alteração de esquema)

Esta funcionalidade **não introduz nem altera** entidades persistidas. Ela consome
entidades já modeladas em `src/data/types.ts` e geridas por `src/store/AppStore.tsx`
(mock em memória). Abaixo, apenas os campos relevantes para o que a tela de Início
exibe:

### Usuária (Psicóloga)

Fonte: `AuthStore` (`Usuario`).

| Campo | Uso na tela de Início |
|---|---|
| `nome` | Primeiro nome exibido na saudação (FR-001) |

### Sessão

Fonte: `AppStore` (`Sessao`), via `sessoesDoDia(sessoes, hoje)`.

| Campo | Uso na tela de Início |
|---|---|
| `data` | Filtra as sessões do dia atual |
| `hora` | Exibido no destaque de próxima sessão; usado para determinar qual sessão é "a próxima" em relação ao relógio corrente (FR-015) |
| `status` | Determina elegibilidade para "próxima sessão" (`confirmada`/`pendente`) e para a lista de pendências de confirmação (`pendente`) |
| `modalidade`, `duracaoMin` | Exibidos no destaque de próxima sessão |
| `valor` | Exibido mascarado por padrão no destaque de próxima sessão (FR-004) |
| `pacienteId` | Resolve o paciente vinculado para nome/ficha |

### Paciente

Fonte: `AppStore` (`Paciente`), via `paciente(id)`.

| Campo | Uso na tela de Início |
|---|---|
| `nome` | Exibido nas sessões do dia, no destaque e nas pendências (sem máscara — decisão de clarificação) |
| `id` | Navegação para a ficha do paciente |

### Lançamento Financeiro

Fonte: `AppStore` (`Lancamento`), via `lancamentos.filter(l => !l.pago)` + `soma()`.

| Campo | Uso na tela de Início |
|---|---|
| `pago` | Determina quais lançamentos entram no total "a receber" |
| `valor` | Somado no total a receber, exibido mascarado por padrão (FR-003) |

## Estado de UI transitório (novo, não persistido)

Estes não são entidades de domínio — são estados locais do componente da tela,
explicitamente **não** persistidos (FR-016), que deixam de existir ao desmontar o
componente:

| Estado | Tipo | Resetado quando | Requisito |
|---|---|---|---|
| `valorReceberVisivel` | `boolean` (padrão `false`) | A cada foco da tela (`useFocusEffect`) | FR-003, FR-016 |
| `valorProximaSessaoVisivel` | `boolean` (padrão `false`) | A cada foco da tela, e também ao trocar qual sessão está em destaque | FR-004, FR-016 |
| `agora` | `Date` / timestamp, atualizado por `setInterval` | Limpo no unmount/blur da tela | FR-015 |
| `semConexao` | `boolean`, derivado de `useNetworkState()` (`expo-network`) | Reavaliado a cada mudança de estado de rede reportada pelo módulo | FR-014 |

Nenhuma migração, schema novo ou mudança de contrato de armazenamento é necessária.
