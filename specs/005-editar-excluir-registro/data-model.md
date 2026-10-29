# Phase 1 Data Model: Editar e Excluir (Individual e em Lote) Registro de Sessão, Prontuário e Financeiro

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Revisão (Parte 4 — exclusão lógica/soft-delete universal)**: esta revisão
substitui por completo a Parte 3 (nunca aplicada em produção). As 4 tabelas desta
spec ganham uma coluna booleana própria de exclusão lógica — ver
[contracts/migracao-exclusao-logica.sql](./contracts/migracao-exclusao-logica.sql).
Nenhuma dessas tabelas recebe mais `DELETE` desta funcionalidade; toda remoção é um
`UPDATE` marcando a coluna como `true`.

## Visão geral: uma coluna por entidade, um único filtro de leitura

| Entidade | Coluna de exclusão lógica | Quem pode marcá-la |
|---|---|---|
| `Paciente` | `excluido` | Exclusão direta (História 6) |
| `Sessão` | `excluida` | Exclusão direta (História 2/4) ou cascata do paciente |
| `Lançamento Financeiro` | `excluido` | Exclusão direta (História 3/5), cascata da sessão, ou cascata do paciente |
| `Nota de Atendimento` | `excluida` | Exclusão direta (História 7), cascata da sessão, ou cascata do paciente |

Todas as queries que carregam essas 4 tabelas no `AppStore` (ao iniciar o app) DEVEM
filtrar pela coluna correspondente = `false`. Esse é o único ponto de verdade que
garante FR-019 — nenhuma tela ou seletor (`sessoesDoDia`, Agenda, Financeiro, Início,
Prontuário, lista de Pacientes) precisa de um filtro próprio, porque o estado local
carregado nunca contém uma linha excluída (ver `research.md`, Decisão 10).

## Sessão — regra de exclusão (FR-005, FR-006, FR-007)

| Vínculo no momento da exclusão | Resultado |
|---|---|
| `Lançamento` vinculado | Marcado como excluído (`excluido = true`) — não é apagado |
| `Nota` ativa vinculada | Marcada como excluída (`excluida = true`) — não é apagada |
| Nenhum dos dois | A sessão é simplesmente marcada como excluída |

Nenhuma condição bloqueia a exclusão da sessão (exceto falha de conexão, FR-009).
Ordem de execução: primeiro marca lançamento(s) e nota(s) vinculados, depois marca a
própria sessão — se a conexão cair entre essas chamadas, a sessão continua visível
(não excluída) até que a ação seja refeita com sucesso, evitando um estado "sessão
excluída, mas lançamento/nota ainda ativos e órfãos visualmente".

## Paciente — cascata completa (FR-015, FR-016) — NOVO nesta revisão

| Vínculo no momento da exclusão | Resultado |
|---|---|
| Sessões do paciente | Todas marcadas como excluídas (`sessoes.excluida = true where paciente_id = ...`) |
| Lançamentos do paciente | Todos marcados como excluídos (`lancamentos.excluido = true where paciente_id = ...`) |
| Notas do paciente | Todas marcadas como excluídas (`notas.excluida = true where paciente_id = ...`) |
| Paciente | Marcado como excluído por último, só depois que as 3 cascatas acima tiverem sucesso |

A cascata do paciente é sempre **completa** (decisão confirmada via
`/speckit-clarify`) — não existe uma exclusão "parcial" de paciente que deixe parte
do histórico ativo. É feita com 3 `UPDATE`s diretos por `paciente_id` (não
encadeando `excluirSessao` sessão por sessão) — ver `research.md`, Decisão 11.

## Lançamento Financeiro — três formas de exclusão lógica (FR-006, FR-008, FR-016)

- **Isolada**: via `removerLancamento`, sem tocar na sessão (História 3).
- **Em cascata pela sessão**: ao excluir a sessão a que está vinculado (História 2/4).
- **Em cascata pelo paciente**: ao excluir o paciente (História 6, novo).

Nenhuma outra tabela referencia `lancamentos.id`, então a remoção isolada nunca
precisa propagar mais nada.

## Nota de Atendimento — identidade por sessão ativa + estado excluída (FR-004, FR-007, FR-017)

- **No máximo uma nota ativa por sessão** (regra de domínio já estabelecida;
  reinterpretada nesta revisão para considerar só notas não excluídas — ver
  `research.md`, Decisão 3). Editar atualiza a nota ativa existente; nunca duplica
  entre notas ativas. Uma nota já excluída nunca volta a ser "a nota da sessão" —
  uma nova anotação, se escrita, cria uma nota nova e independente.
- **Coluna**: `excluida boolean not null default false`. `false` para toda nota
  criada normalmente ao registrar uma sessão. Passa a `true` quando: (a) a própria
  nota é excluída diretamente pela aba Prontuário (História 7, novo); (b) a sessão
  vinculada é excluída (cascata, História 2/4); ou (c) o paciente vinculado é
  excluído (cascata, História 6, novo).
- Uma nota excluída **nunca é apagada** por esta funcionalidade — seu `texto`,
  `pacienteId` e `sessaoId` permanecem intactos; apenas `excluida` passa a `true`.
- A aba "Prontuário" (`src/app/paciente/[id]/index.tsx`) não precisa mais filtrar
  localmente (a query inicial já só traz notas ativas — ver Decisão 10), mas passa a
  oferecer um botão de exclusão por nota (História 7).

## Exclusão em lote — resultado por item (FR-010 a FR-014)

Uma exclusão em lote continua sendo N chamadas independentes, não uma transação SQL
única (ver `research.md`, Decisão 5), para poder reportar com precisão onde um lote
parou em caso de falha de conexão:

| Categoria | Significado |
|---|---|
| Excluídas | Item (e seus vínculos em cascata, se aplicável) marcados como excluídos com sucesso |
| Não processadas | Só ocorre se a conexão cair no meio do lote — itens restantes que nem chegaram a ser tentados (FR-014) |

Exclusão em lote de sessões (História 4) e remoção em lote de lançamentos (História
5) seguem essa mesma tabela de duas categorias — inalterado desde a Parte 3/4 (a
categoria "mantidas" de versões anteriores não existe mais).
