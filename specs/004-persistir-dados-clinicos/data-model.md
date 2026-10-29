# Phase 1 Data Model: Persistência Real de Pacientes, Sessões e Financeiro

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

O DDL completo (tipos SQL exatos, defaults, índices, RLS) está em
[contracts/schema.sql](./contracts/schema.sql). Este documento descreve o modelo em
termos de domínio, espelhando os tipos TypeScript já existentes em
`src/data/types.ts`, que permanecem inalterados — só a fonte dos dados muda.

## Paciente

Campos (FR-001, FR-002): `id`, `nome`, `iniciais`, `frequencia`
(`Semanal`|`Quinzenal`|`Mensal`), `diaFixo` (0–6), `horaFixa` (`HH:MM`), `modalidade`
(`Presencial`|`Online`), `valorSessao`, `desde` (data), `telefone`.

- Pertence a exatamente uma conta (`psicologa_id`) — FR-003.
- **Regra de exclusão (FR-009, Clarifications)**: um paciente só pode ser excluído
  enquanto não tiver nenhuma `Sessão`, `Lançamento Financeiro` ou `Nota` vinculada.
  Garantida pelo banco (chaves estrangeiras `ON DELETE RESTRICT` — ver Decisão 2 em
  `research.md`), não apenas pela interface.
- Sem estado de "arquivado": ou o paciente está ativo (sempre visível), ou foi
  excluído (só possível sem histórico). Não há estado intermediário nesta feature.

## Sessão

Campos (FR-004, FR-005): `id`, `pacienteId`, `data`, `hora`, `status` (`pendente` |
`confirmada` | `realizada` | `faltou` | `remarcada`), `modalidade`, `valor`,
`duracaoMin`.

- Vinculada a um `Paciente` da mesma conta (`psicologa_id` deve coincidir — reforçado
  por RLS, não apenas pela FK).
- Transições de status são todas permitidas por uma ação explícita da psicóloga
  (confirmar; registrar como realizada/faltou/remarcada); não há transição automática
  por tempo nesta feature (a tela de Início, spec 003, já lida com "sessão passou do
  horário" apenas na apresentação, sem mudar o status real).

## Lançamento Financeiro

Campos (FR-006, FR-007): `id`, `pacienteId`, `sessaoId` (opcional), `data`, `valor`,
`pago` (boolean), `metodo` (opcional: `Pix`|`Cartão`|`Dinheiro`|`Convênio`), `cobrado`
(opcional boolean — lembrete de cobrança enviado, distinto de `pago`; ver Decisão 5 em
`research.md`).

- Criado junto com o registro de uma sessão como realizada (`pago` decidido nesse
  momento) e também pode ter seu status de pagamento alterado depois, via a nova ação
  "Marcar como pago" (FR-007).
- Vinculado a um `Paciente` da mesma conta; se vinculado a uma `Sessão`, ambos devem
  pertencer à mesma conta (reforçado por RLS).

## Nota de Atendimento

Campos (FR-008): `id`, `pacienteId`, `sessaoId` (opcional), `data`, `texto`.

- Criada junto com o registro de uma sessão (texto opcional informado nesse momento);
  esta feature não adiciona uma tela separada só para criar notas fora desse fluxo
  (consistente com o comportamento já existente).
- Dado sensível (prontuário) — nunca logado, nunca enviado a terceiros (Princípio III).

## Isolamento por conta (todas as 4 entidades)

Toda linha de `pacientes`, `sessoes`, `lancamentos` e `notas` tem uma coluna
`psicologa_id` não nula, referenciando a conta de autenticação (Supabase Auth, spec
002). Row Level Security garante que uma conta só pode ler/criar/editar/excluir linhas
onde `psicologa_id = auth.uid()` — nenhuma consulta da conta A pode retornar ou afetar
linhas da conta B, mesmo que a query não filtre explicitamente por conta (FR-003,
SC-002).

## Resolução de conflito de edição concorrente

Conforme a suposição já registrada na spec (mesma conta em dois aparelhos): a última
gravação bem-sucedida no banco prevalece. Não há coluna de versão/lock otimista nesta
feature — cada `UPDATE` sobrescreve os campos enviados, sem comparar com um estado
anterior lido.
