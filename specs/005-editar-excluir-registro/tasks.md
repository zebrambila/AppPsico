---
description: "Task list template for feature implementation"
---

# Tasks: Editar e Excluir (Individual e em Lote) Registro de Sessão, Prontuário e Financeiro

**Input**: Design documents from `/specs/005-editar-excluir-registro/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Não solicitados na especificação (sem framework de testes automatizados no
projeto). Validação manual pelos 8 cenários de `quickstart.md`, na Fase final.

**Organization**: Tarefas agrupadas por história de usuário. T001-T011 (Fases 3-5 e
parte da 12) são da Parte 1 (exclusão/edição individual). T012-T021 (Fases 6-7 e
parte da 12) são a Parte 2 (exclusão em lote). T022-T032 (Fase 9) eram a Parte 3
(exclusão em cascata física + arquivamento) — **essa migração nunca foi aplicada em
produção (T022 ficou pendente) e é descartada por completo por esta revisão**. T033+
(Fase 11) são a Parte 4 desta revisão (exclusão lógica/soft-delete universal: nenhuma
das 4 entidades volta a ser apagada fisicamente; inclui as novas Histórias 6
— excluir paciente com cascata completa — e 7 — excluir nota individualmente) — ver
`research.md`, Decisões 9-12.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1 a US5
- Caminhos de arquivo exatos estão incluídos em cada descrição

## Path Conventions

Projeto único (Expo/React Native). Parte 1: `src/store/AppStore.tsx` e
`src/app/sessao/registrar.tsx`. Parte 2 (exclusão em lote): os mesmos dois arquivos
mais `src/app/(tabs)/agenda.tsx` e `src/app/(tabs)/financeiro.tsx`. Parte 3 (nunca
aplicada, descartada): seria os mesmos arquivos de código mais
`src/app/paciente/[id]/index.tsx` e uma migração de schema (`contracts/
migracao-cascata.sql`, removido desta spec). Parte 4 (esta revisão): `src/data/
types.ts`, `src/store/AppStore.tsx`, `src/app/paciente/[id]/index.tsx`,
`src/data/mock.ts` (apenas para manter `tsc` limpo em dados de exemplo não usados em
produção), mais uma migração de schema aplicada manualmente
(`contracts/migracao-exclusao-logica.sql`) — ver `plan.md`.

---

## Phase 1: Setup

**Purpose**: Nenhuma — esta funcionalidade não introduz dependências, tabelas ou
infraestrutura nova (schema da spec 004 já cobre a regra de negócio via FK
`ON DELETE RESTRICT`; ver `research.md`, Decisão 1).

*(fase vazia — avançar direto para a Fase 2)*

---

## Phase 2: Foundational

**Purpose**: Nenhuma tarefa bloqueante compartilhada entre as 3 histórias — cada uma
é aditiva sobre os mesmos dois arquivos, sem uma base comum nova a construir primeiro.

*(fase vazia — avançar direto para a Fase 3)*

---

## Phase 3: User Story 1 - Editar um registro de sessão sem duplicar dados (Priority: P1) 🎯 MVP

**Goal**: Reabrir o registro de uma sessão já registrada mostra os dados reais
salvos (presença, pagamento, anotação), e salvar atualiza em vez de duplicar.

**Independent Test**: Registrar uma sessão com anotação e pagamento, reabrir o
registro, confirmar que os campos vêm preenchidos, alterar algo e salvar, confirmar
que não há anotação nem lançamento duplicados para essa sessão.

### Implementation for User Story 1

- [X] T001 [US1] Em `src/store/AppStore.tsx`, dentro de `registrarSessao`, antes do
  bloco que trata a nota, buscar `const notaExistente = notas.find((n) => n.sessaoId === base.id)`;
  se `texto` (o texto já `.trim()`ado) não estiver vazio: quando `notaExistente`
  existir, fazer `supabase.from('notas').update({ texto }).eq('id', notaExistente.id).select('*').single()`
  e atualizar o item correspondente em `notas` via `setNotas`; só quando
  `notaExistente` não existir, manter o `insert` atual (FR-004; ver `research.md`
  Decisão 3)
- [X] T002 [US1] Em `src/app/sessao/registrar.tsx`, calcular
  `const notaExistente = sessao ? notas.find((n) => n.sessaoId === sessao.id) : undefined`
  (precisa desestruturar `notas` de `useApp()`) e inicializar
  `const [nota, setNota] = useState(notaExistente?.texto ?? '')` em vez de `useState('')`
  (FR-001, FR-004)
- [X] T003 [US1] Em `src/app/sessao/registrar.tsx`, corrigir o valor inicial de
  `presenca` para refletir todos os status possíveis da sessão existente:
  `sessao?.status === 'faltou' ? 'faltou' : sessao?.status === 'remarcada' ? 'remarcou' : 'compareceu'`
  (hoje só `'faltou'` é tratado como caso especial; `'remarcada'` cai incorretamente
  em `'compareceu'`) (FR-001; ver `research.md` Decisão 2)
- [X] T004 [US1] Confirmar manualmente (sem necessidade de mudança de código, já que
  `registrarSessao` já faz `update` no lançamento existente quando encontrado) que
  editar o método/status de pagamento de uma sessão já registrada atualiza o mesmo
  lançamento em vez de criar um segundo, exercitando o cenário 2 de `quickstart.md`
  (FR-003)

**Checkpoint**: User Story 1 funcional e testável de forma independente.

---

## Phase 4: User Story 2 - Excluir uma sessão registrada por engano (Priority: P1)

**Goal**: Excluir uma sessão pela tela de registro, bloqueado por completo quando
houver anotação de prontuário e/ou lançamento financeiro vinculado.

**Independent Test**: Criar uma sessão sem registro, excluí-la com sucesso; tentar
excluir uma sessão já registrada (com nota/lançamento) e confirmar o bloqueio com
mensagem explicando o motivo.

### Implementation for User Story 2

- [X] T005 [US2] Em `src/store/AppStore.tsx`, implementar
  `excluirSessao(sessaoId: string): Promise<void>`: verifica conectividade
  (`exigirConexao()`); monta a lista de vínculos presentes checando
  `notas.some((n) => n.sessaoId === sessaoId)` e
  `lancamentos.some((l) => l.sessaoId === sessaoId)`; se algum for verdadeiro, rejeita
  com uma mensagem que cita exatamente o que está vinculado (ex.: "Essa sessão tem uma
  anotação de prontuário e por isso não pode ser excluída.", "...tem um lançamento
  financeiro...", ou menciona os dois) sem chamar o Supabase; caso contrário, chama
  `supabase.from('sessoes').delete().eq('id', sessaoId)`, tratando também o código de
  erro `23503` como rede de segurança com a mesma mensagem combinada, e em sucesso
  remove a sessão de `sessoes` via `setSessoes` (FR-005, FR-006, FR-007, FR-009; ver
  `research.md` Decisão 1)
- [X] T006 [US2] Em `src/app/sessao/registrar.tsx`, adicionar um botão "Excluir
  sessão" (visível apenas quando `sessao` existe, ou seja, é um registro já
  existente, não uma criação rápida sem `sessaoId`) que abre um `Alert.alert` de
  confirmação (mesmo padrão usado em `src/app/paciente/[id]/index.tsx` para excluir
  paciente) e, ao confirmar, chama `excluirSessao(sessao.id)`; em sucesso, mostra
  `showToast` e `router.back()`; em falha, mostra a mensagem de erro via `showToast`
  sem navegar (FR-005)

**Checkpoint**: User Stories 1 e 2 funcionais, cada uma testável independentemente.

---

## Phase 5: User Story 3 - Corrigir ou remover só o lançamento financeiro de uma sessão (Priority: P2)

**Goal**: Remover isoladamente o lançamento financeiro de uma sessão, sem afetar a
sessão nem a anotação.

**Independent Test**: Registrar uma sessão com pagamento marcado por engano, remover
só o lançamento pela tela de registro, confirmar que ele some do financeiro enquanto
sessão e anotação continuam intactas; em seguida, confirmar que excluir a sessão
passa a ser bloqueada só pela anotação (não mais pelo lançamento, que já foi removido).

### Implementation for User Story 3

- [X] T007 [US3] Em `src/store/AppStore.tsx`, implementar
  `removerLancamento(lancamentoId: string): Promise<void>`: verifica conectividade;
  chama `supabase.from('lancamentos').delete().eq('id', lancamentoId)` (nenhuma outra
  tabela referencia `lancamentos.id`, então não há violação de FK a tratar — ver
  `research.md` Decisão 4); em sucesso, remove o lançamento de `lancamentos` via
  `setLancamentos` (FR-008)
- [X] T008 [US3] Em `src/app/sessao/registrar.tsx`, adicionar um botão "Remover
  lançamento" (visível apenas quando `lancExistente` existir) que abre um
  `Alert.alert` de confirmação e, ao confirmar, chama
  `removerLancamento(lancExistente.id)`; em sucesso, mostra `showToast` e atualiza a
  tela para refletir que não há mais lançamento (sem navegar de volta, já que a
  sessão e a anotação continuam na mesma tela); em falha, mostra a mensagem de erro
  via `showToast` (FR-008)

**Checkpoint**: Todas as histórias de usuário individuais (US1-US3) funcionais de
forma independente. *(T009-T011 originais desta fase foram renumeradas para a Fase
8, Polish, após a adição das Histórias 4 e 5 abaixo.)*

---

## Phase 6: User Story 4 - Excluir várias sessões de uma vez (Priority: P2)

**Goal**: Selecionar várias sessões do dia aberto na Agenda e excluí-las em uma
única ação, mantendo intactas as que tiverem anotação e/ou lançamento vinculado
(exclusão parcial por item, confirmada em `/speckit-clarify`).

**Independent Test**: Criar, no mesmo dia da Agenda, 3 sessões sem histórico e 1 já
registrada (com anotação/lançamento); selecionar as 4 e confirmar a exclusão em
lote; confirmar que as 3 sem histórico são excluídas, a 1 com histórico permanece, e
a mensagem final resume o resultado.

### Implementation for User Story 4

- [X] T012 [US4] Em `src/store/AppStore.tsx`, implementar
  `excluirSessoesEmLote(sessaoIds: string[]): Promise<{ excluidas: string[]; mantidas: { id: string; motivo: string }[]; naoProcessadas: string[] }>`:
  verifica conectividade uma vez no início (`exigirConexao()`); em seguida, para cada
  id, chama a mesma lógica de `excluirSessao` (sem repetir o `exigirConexao` a cada
  item) dentro de um `try/catch`: sucesso vai para `excluidas`; rejeição pela regra de
  bloqueio (nota/lançamento) vai para `mantidas` com o motivo; qualquer outro erro
  (ex.: conexão cair no meio do laço) interrompe o processamento dos ids restantes,
  que são devolvidos em `naoProcessadas`, sem relançar a exceção (FR-010, FR-011,
  FR-012, FR-014; ver `research.md` Decisão 5 — nunca um `DELETE ... IN (...)` único)
- [X] T013 [US4] Em `src/app/(tabs)/agenda.tsx`, adicionar estado local
  `selecionando: boolean` e `selecionados: Set<string>`, com um botão
  "Selecionar"/"Cancelar" no cabeçalho que alterna `selecionando` e limpa
  `selecionados` ao desativar (FR-010; ver `research.md` Decisão 6)
- [X] T014 [US4] Em `src/app/(tabs)/agenda.tsx`, quando `selecionando` for `true`,
  trocar o `onPress` de cada `SessionRow` do dia aberto (hoje navega para
  `sessao/registrar`) por um toggle de `s.id` em `selecionados`, e indicar
  visualmente o item selecionado (ex.: borda/realce usando `colors.primary`,
  reaproveitando o padrão de seleção já usado em `Pill`)
- [X] T015 [US4] Em `src/app/(tabs)/agenda.tsx`, quando `selecionando` for `true` e
  `selecionados.size > 0`, mostrar uma barra de ação com a contagem selecionada e um
  botão "Excluir selecionadas" que abre `Alert.alert` de confirmação informando a
  quantidade; ao confirmar, chama `excluirSessoesEmLote([...selecionados])`, mostra
  via `showToast` um resumo ("X excluídas" + ", Y mantidas (têm prontuário/financeiro
  vinculado)" quando `mantidas.length > 0`), e limpa a seleção saindo do modo de
  seleção (FR-012)

**Checkpoint**: User Story 4 funcional e testável de forma independente, sem
depender das Histórias 1-3 (embora reaproveite `excluirSessao` internamente).

---

## Phase 7: User Story 5 - Excluir vários lançamentos financeiros de uma vez (Priority: P2)

**Goal**: Selecionar vários lançamentos na tela Financeiro e removê-los em uma
única ação.

**Independent Test**: Criar 2 lançamentos de teste na tela Financeiro, selecioná-los,
confirmar a remoção em lote (a confirmação mostra quantidade e valor total), e
confirmar que ambos somem dos resumos financeiros sem afetar sessões/anotações.

### Implementation for User Story 5

- [X] T016 [US5] Em `src/store/AppStore.tsx`, implementar
  `removerLancamentosEmLote(lancamentoIds: string[]): Promise<{ removidos: string[]; naoProcessados: string[] }>`:
  verifica conectividade uma vez no início; para cada id, chama a mesma lógica de
  `removerLancamento` dentro de um `try/catch`, acumulando sucessos em `removidos`;
  se ocorrer um erro genuíno (não há regra de bloqueio para lançamentos — Decisão 4 —
  então qualquer erro aqui é falha real, ex.: conexão), interrompe o laço e devolve
  os ids restantes em `naoProcessados` (FR-013, FR-014; ver `research.md` Decisão 5)
- [X] T017 [US5] Em `src/app/(tabs)/financeiro.tsx`, adicionar estado local
  `selecionando: boolean` e `selecionados: Set<string>`, com um botão
  "Selecionar"/"Cancelar" no cabeçalho da seção "Lançamentos" (FR-013; ver
  `research.md` Decisão 6)
- [X] T018 [US5] Em `src/app/(tabs)/financeiro.tsx`, quando `selecionando` for
  `true`, cada `Card` de lançamento da lista passa a alternar `l.id` em
  `selecionados` ao ser tocado (em vez de não ter nenhuma ação, como hoje), com
  indicação visual do item selecionado
- [X] T019 [US5] Em `src/app/(tabs)/financeiro.tsx`, quando `selecionando` for
  `true` e `selecionados.size > 0`, mostrar uma barra de ação com a contagem e o
  valor total dos lançamentos selecionados (somando `l.valor` dos selecionados) e um
  botão "Remover selecionados" que abre `Alert.alert` de confirmação informando
  quantidade e valor; ao confirmar, chama
  `removerLancamentosEmLote([...selecionados])`, mostra `showToast` com o resultado,
  e limpa a seleção saindo do modo de seleção (FR-013)

**Checkpoint**: Todas as 5 histórias de usuário funcionais de forma independente.

---

## Phase 9: Exclusão em Cascata (Parte 3 — revisão) — substitui o bloqueio das Fases 4 e 6

**Goal**: Excluir uma sessão exclui de verdade o lançamento financeiro vinculado e
arquiva (nunca apaga) qualquer anotação vinculada, em vez de bloquear a exclusão —
tanto individual (US2) quanto em lote (US4).

**Independent Test**: Criar uma sessão com lançamento e anotação vinculados; excluí-la
pela tela de registro; confirmar que o lançamento some de todo lugar e que a anotação
some do prontuário normal mas continua existindo no banco com `arquivada = true`.
Repetir via exclusão em lote na Agenda com várias sessões: todas devem ser excluídas
sempre (sem categoria "mantida").

### Implementation

- [ ] T022 Aplicar o script `contracts/migracao-cascata.sql` no SQL Editor do painel
  do Supabase: antes de rodar, confirmar o nome real das constraints com
  `select conname from pg_constraint where conrelid = 'public.lancamentos'::regclass;`
  e o mesmo para `public.notas`, ajustando os nomes no script se divergirem do padrão
  (`lancamentos_sessao_id_fkey`, `notas_sessao_id_fkey`) antes de executar; confirmar
  no painel que `lancamentos.sessao_id` agora é `ON DELETE CASCADE`, que
  `notas.sessao_id` agora é `ON DELETE SET NULL`, e que `notas.arquivada` existe
  como `boolean not null default false`
- [X] T023 [US2] Em `src/data/types.ts`, adicionar `arquivada: boolean` à interface
  `Nota`
- [X] T024 [US2] Em `src/store/AppStore.tsx`, adicionar `arquivada: boolean` à
  interface `LinhaNota` e ao mapeamento `deNota` (`arquivada: r.arquivada`)
- [X] T025 [US2] Em `src/store/AppStore.tsx`, remover a classe `ErroBloqueado` e
  reescrever `tentarExcluirSessao(sessaoId)`: (1) se houver nota(s) com
  `sessaoId` igual, `supabase.from('notas').update({ arquivada: true }).eq('sessao_id', sessaoId).select('id')`,
  e em sucesso atualizar `notas` localmente marcando essas notas como
  `arquivada: true`; (2) `supabase.from('sessoes').delete().eq('id', sessaoId).select('id')`,
  lançando erro se `error` ou se o array retornado vier vazio (mesma checagem já
  usada para detectar exclusão silenciosamente ignorada); em sucesso, remover a
  sessão de `sessoes` e remover de `lancamentos` qualquer item cujo `sessaoId` seja
  o da sessão excluída (o banco já cascateou a exclusão real via `ON DELETE
  CASCADE`; o cliente só espelha isso no estado) (FR-006, FR-007; ver `research.md`
  Decisões 7-8)
- [X] T026 [US2] Em `src/store/AppStore.tsx`, simplificar `excluirSessao(sessaoId)`
  para `exigirConexao(); await tentarExcluirSessao(sessaoId);` (sem mais o
  `try/catch` que traduzia `ErroBloqueado`, já que não há mais bloqueio)
- [X] T027 [US4] Em `src/store/AppStore.tsx`, atualizar a assinatura e a lógica de
  `excluirSessoesEmLote(sessaoIds)` para
  `Promise<{ excluidas: string[]; naoProcessadas: string[] }>` (remover `mantidas`
  da assinatura em `AppState` e da implementação): o laço chama
  `tentarExcluirSessao(id)` para cada item, acumulando sucessos em `excluidas`; como
  não há mais rejeição por bloqueio, qualquer erro capturado agora é uma falha
  genuína (ex.: conexão) e interrompe o laço, devolvendo o restante em
  `naoProcessadas` (FR-011, FR-012, FR-014)
- [X] T028 [US2] Em `src/app/paciente/[id]/index.tsx`, filtrar `notasPac` para
  excluir anotações arquivadas: `notas.filter((n) => n.pacienteId === p.id && !n.arquivada)`
  (FR-007)
- [X] T029 [US2] Em `src/app/sessao/registrar.tsx`, atualizar a mensagem de
  `confirmarAcao` da função `excluir` para refletir o novo comportamento: algo como
  "Tem certeza que deseja excluir esta sessão? O lançamento financeiro vinculado
  (se houver) será excluído e qualquer anotação será arquivada. Essa ação não pode
  ser desfeita." (FR-005)
- [X] T030 [US4] Em `src/app/(tabs)/agenda.tsx`, atualizar `excluirSelecionadas`
  para o novo formato de retorno de `excluirSessoesEmLote` (sem `mantidas`):
  a mensagem final do `showToast` passa a ser só
  `${plural(resultado.excluidas.length, 'sessão excluída', 'sessões excluídas')}`
  mais, quando houver, a parte de `naoProcessadas`; remover o bloco que mencionava
  "mantida(s)"; atualizar a mensagem de confirmação para mencionar que lançamentos
  vinculados serão excluídos e anotações arquivadas

**Checkpoint**: Exclusão de sessão (individual e em lote) sempre executa a cascata
completa (lançamento excluído, nota arquivada), sem nenhuma condição de bloqueio
restante. **Nota: esta fase nunca chegou a ser aplicada em produção (T022 ficou
pendente) e é descartada por completo pela Fase 11 abaixo — o código escrito aqui é
substituído, não complementado.**

---

## Phase 11: Exclusão Lógica/Soft-Delete Universal (Parte 4 — revisão) — substitui por completo a Fase 9

**Goal**: Nenhuma das 4 entidades (paciente, sessão, lançamento, nota) volta a ser
apagada fisicamente. Cada uma ganha sua própria coluna booleana de exclusão lógica;
a cascata (sessão → lançamento + nota; paciente → sessões + lançamentos + notas) é
feita por `UPDATE`, não por `DELETE` nem por FK `CASCADE`/`SET NULL`. Inclui duas
capacidades novas: excluir um paciente (História 6) e excluir uma nota de prontuário
individualmente (História 7).

**Independent Test**: Criar um paciente de teste com uma sessão (lançamento + nota
vinculados); excluir só a nota pela aba Prontuário e confirmar que ela some mas a
sessão/lançamento continuam; excluir a sessão e confirmar que lançamento e nota
(se ainda ativa) somem também; por fim excluir o paciente e confirmar que tudo o que
resta dele (outras sessões/lançamentos/notas) some de uma vez. Em cada passo,
confirmar via SQL Editor do Supabase que nenhuma linha foi de fato apagada — todas
continuam existindo com a coluna de exclusão lógica em `true`.

### Implementation for Phase 11

- [ ] T033 Aplicar o script
  `contracts/migracao-exclusao-logica.sql` no SQL Editor do painel do Supabase:
  adiciona `pacientes.excluido`, `sessoes.excluida`, `lancamentos.excluido` e
  `notas.excluida`, todas `boolean not null default false`. Confirmar no painel que
  as 4 colunas existem antes de testar qualquer cenário de exclusão desta fase
  (sem a migração aplicada, as chamadas de `UPDATE` das tarefas abaixo falham por
  coluna inexistente)
- [X] T034 Em `src/data/types.ts`: adicionar `excluido: boolean` à interface
  `Paciente`; adicionar `excluida: boolean` à interface `Sessao`; adicionar
  `excluido: boolean` à interface `Lancamento`; renomear o campo `arquivada` da
  interface `Nota` para `excluida: boolean` (atualizar também o comentário da
  propriedade para refletir o novo nome) (FR-018; ver `research.md` Decisões 9, 12)
- [X] T035 Em `src/store/AppStore.tsx`: adicionar `excluido: boolean` a
  `LinhaPaciente` e ao mapeamento `dePaciente` (`excluido: r.excluido`); adicionar
  `excluida: boolean` a `LinhaSessao` e ao mapeamento `deSessao`
  (`excluida: r.excluida`); adicionar `excluido: boolean` a `LinhaLancamento` e ao
  mapeamento `deLancamento` (`excluido: r.excluido`); renomear `arquivada` para
  `excluida` em `LinhaNota` e no mapeamento `deNota`
- [X] T036 Em `src/store/AppStore.tsx`, na função `carregar()` (dentro do
  `useEffect` que carrega os dados iniciais), adicionar
  `.eq('excluido', false)`/`.eq('excluida', false)` a cada uma das 4 queries
  (`supabase.from('pacientes').select('*')` → `.eq('excluido', false)`;
  `supabase.from('sessoes').select('*')` → `.eq('excluida', false)`;
  `supabase.from('lancamentos').select('*')` → `.eq('excluido', false)`;
  `supabase.from('notas').select('*')` → `.eq('excluida', false)`) — esse é o único
  ponto que garante FR-019 para todas as telas (ver `research.md`, Decisão 10)
- [X] T037 [US2] Em `src/store/AppStore.tsx`, reescrever `tentarExcluirSessao(sessaoId)`
  para usar `UPDATE` em vez de `DELETE`, nesta ordem: (1)
  `supabase.from('notas').update({ excluida: true }).eq('sessao_id', sessaoId).eq('excluida', false).select('id')`
  para qualquer nota ativa vinculada, atualizando `notas` localmente
  (`n.sessaoId === sessaoId && !n.excluida` → `excluida: true`); (2)
  `supabase.from('lancamentos').update({ excluido: true }).eq('sessao_id', sessaoId).select('id')`,
  removendo esses itens de `lancamentos` localmente (`setLancamentos((prev) =>
  prev.filter((l) => l.sessaoId !== sessaoId))`); (3)
  `supabase.from('sessoes').update({ excluida: true }).eq('id', sessaoId).select('id')`,
  lançando erro se `error` ou se o array retornado vier vazio (mesma checagem já
  usada para detectar escrita silenciosamente ignorada), removendo a sessão de
  `sessoes` localmente só após essa etapa ter sucesso (FR-006, FR-007, FR-018; ver
  `research.md` Decisão 9)
- [X] T038 [US4] Em `src/store/AppStore.tsx`, confirmar que `excluirSessoesEmLote`
  continua funcionando sem mudança de assinatura ou lógica própria — ela já chama
  `tentarExcluirSessao` (reescrita em T037) em laço; nenhuma edição de código é
  esperada aqui além da reescrita feita em T037
- [X] T039 [US3] Em `src/store/AppStore.tsx`, reescrever `tentarRemoverLancamento(lancamentoId)`
  para `supabase.from('lancamentos').update({ excluido: true }).eq('id', lancamentoId).select('id')`
  em vez de `.delete()`, mantendo a mesma checagem de array vazio e a mesma remoção
  do estado local (`setLancamentos((prev) => prev.filter((l) => l.id !== lancamentoId))`)
  (FR-008, FR-018; ver `research.md` Decisão 4)
- [X] T040 [US5] Em `src/store/AppStore.tsx`, confirmar que `removerLancamentosEmLote`
  continua funcionando sem mudança de assinatura ou lógica própria — ela já chama
  `tentarRemoverLancamento` (reescrita em T039) em laço; nenhuma edição de código é
  esperada aqui além da reescrita feita em T039
- [X] T041 [US6] Em `src/store/AppStore.tsx`, reescrever `excluirPaciente(id)` para
  fazer a cascata completa por `UPDATE` em vez do `DELETE` atual: (1)
  `supabase.from('sessoes').update({ excluida: true }).eq('paciente_id', id).select('id')`;
  (2) `supabase.from('lancamentos').update({ excluido: true }).eq('paciente_id', id).select('id')`;
  (3) `supabase.from('notas').update({ excluida: true }).eq('paciente_id', id).select('id')`;
  (4), só depois das 3 anteriores terem sucesso,
  `supabase.from('pacientes').update({ excluido: true }).eq('id', id).select('id')`,
  lançando erro se qualquer uma das 4 chamadas falhar ou retornar array vazio; em
  sucesso total, remover localmente o paciente de `pacientes` e remover de
  `sessoes`/`lancamentos`/`notas` todos os itens cujo `pacienteId` seja `id`; remover
  também a checagem de `CODIGO_FK_VIOLADA` (não há mais `DELETE`, então não há mais
  violação de FK a tratar aqui) (FR-015, FR-016, FR-018; ver `research.md` Decisões
  9, 11)
- [X] T042 [US6] Em `src/app/paciente/[id]/index.tsx`, atualizar a mensagem de
  `confirmarAcao` da função `excluir` para informar que todo o histórico vinculado
  (sessões, lançamentos e notas) também será marcado como excluído, não só o
  paciente (ex.: "Tem certeza que deseja excluir {nome}? Todas as sessões,
  lançamentos e notas vinculados a esse paciente também serão excluídos. Essa ação
  não pode ser desfeita.") (FR-015)
- [X] T043 [US7] Em `src/store/AppStore.tsx`, adicionar uma nova função
  `excluirNota(notaId: string): Promise<void>`: `exigirConexao()`, depois
  `supabase.from('notas').update({ excluida: true }).eq('id', notaId).select('id')`,
  lançando erro se `error` ou array vazio; em sucesso, remover a nota de `notas`
  localmente (`setNotas((prev) => prev.filter((n) => n.id !== notaId))`). Adicionar
  `excluirNota: (notaId: string) => Promise<void>;` à interface `AppState`, e
  incluir `excluirNota` tanto no objeto retornado por `useMemo` quanto no array de
  dependências desse `useMemo` (FR-017, FR-018)
- [X] T044 [US7] Em `src/app/paciente/[id]/index.tsx`, na aba "Prontuário", adicionar
  um botão/ícone de excluir em cada `Card` de nota listado em `notasPac.map(...)`
  que, ao ser tocado, chama `confirmarAcao` (mesmo padrão já usado para excluir
  paciente/sessão/lançamento) perguntando confirmação antes de excluir, e em
  confirmação chama `excluirNota(n.id)`, mostrando `showToast` em sucesso ou erro
  (FR-017)
- [X] T045 [US2] Em `src/store/AppStore.tsx`, dentro de `registrarSessao`, atualizar
  a busca de nota existente de `notas.find((n) => n.sessaoId === base.id)` para
  `notas.find((n) => n.sessaoId === base.id && !n.excluida)` — uma nota já excluída
  (História 7) nunca deve ser reativada/sobrescrita por uma nova anotação escrita ao
  reabrir o registro da mesma sessão; se nenhuma nota ativa for encontrada, o fluxo
  de `insert` já existente cria uma nota nova e independente (FR-004; ver
  `research.md` Decisão 3)
- [X] T046 Em `src/app/paciente/[id]/index.tsx`, simplificar `notasPac` removendo o
  filtro local `!n.arquivada`/`!n.excluida` — a query inicial do `AppStore` (T036) já
  garante que notas excluídas nunca chegam ao estado local, então o filtro
  client-side se torna redundante (manter apenas
  `notas.filter((n) => n.pacienteId === p.id).sort(ordenarPorDataDesc)`)
- [X] T047 Em `src/data/mock.ts`, atualizar os geradores de dados de exemplo para
  compilar com os novos campos: adicionar `excluido: false` a cada paciente em
  `pacientesIniciais`, `excluida: false` a cada sessão retornada por `sessao(...)`,
  `excluido: false` a cada lançamento em `lancamentosIniciais`, e renomear
  `arquivada: false` para `excluida: false` em `notasIniciais` (arquivo não
  importado por nenhuma tela em produção — apenas mantém `npx tsc --noEmit` limpo)

**Checkpoint**: Nenhuma ação de exclusão desta funcionalidade (individual, em lote,
sessão, lançamento, nota ou paciente) emite mais um `DELETE`; todas as 7 histórias de
usuário permanecem funcionais, agora com retenção universal de dados.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Portões de qualidade da Constituição e validação manual final de toda
a funcionalidade (Partes 1, 2 e 4 — a Parte 3 foi descartada sem chegar a produção).

- [X] T009 [P] Rodar `npx expo lint` a partir da raiz do repositório e corrigir todos
  os erros/avisos resultantes das mudanças da Parte 1 (US1-US3) — **já executado**
- [X] T010 [P] Rodar `npx tsc --noEmit` a partir da raiz do repositório e corrigir
  todos os erros de tipo resultantes das mudanças da Parte 1 (US1-US3) — **já
  executado**
- [X] T020 [P] Rodar `npx expo lint` novamente após T012-T019 (Parte 2) e corrigir
  todos os erros/avisos resultantes das mudanças em `agenda.tsx`/`financeiro.tsx`
- [X] T021 [P] Rodar `npx tsc --noEmit` novamente após T012-T019 (Parte 2) e corrigir
  todos os erros de tipo resultantes
- [X] T031 [P] Rodar `npx expo lint` novamente após T022-T030 (Parte 3, descartada) e
  corrigir todos os erros/avisos resultantes — histórico; código posteriormente
  reescrito pela Fase 11
- [X] T032 [P] Rodar `npx tsc --noEmit` novamente após T022-T030 (Parte 3, descartada)
  e corrigir todos os erros de tipo resultantes — histórico; código posteriormente
  reescrito pela Fase 11
- [X] T048 [P] Rodar `npx expo lint` novamente após T033-T047 (Fase 11, Parte 4) e
  corrigir todos os erros/avisos resultantes
- [X] T049 [P] Rodar `npx tsc --noEmit` novamente após T033-T047 (Fase 11, Parte 4) e
  corrigir todos os erros de tipo resultantes
- [ ] T011 Executar manualmente os 10 cenários de
  `specs/005-editar-excluir-registro/quickstart.md` (prefill correto, editar sem
  duplicar, excluir sem nenhum vínculo, exclusão lógica em cascata da sessão,
  remover só o lançamento, bloqueio offline, exclusão em lote de sessões, remoção em
  lote de lançamentos, excluir um paciente com cascata completa, excluir uma nota
  individualmente) — **PENDENTE**: verificação automatizada parcial feita via
  `npx expo start --web` em partes anteriores; a validação interativa completa com
  dados reais do Supabase — que exige **T033 (migração de schema desta revisão)
  aplicada primeiro** — ainda não foi executada nesta sessão

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** e **Foundational (Phase 2)**: vazias nesta funcionalidade
- **User Stories individuais (Phase 3-5, US1-US3)**: concluídas (Parte 1) — editam os
  mesmos dois arquivos (`AppStore.tsx`, `registrar.tsx`)
- **User Stories em lote (Phase 6-7, US4-US5)**: dependem de US2 (`excluirSessao`) e
  US3 (`removerLancamento`) já existirem no `AppStore.tsx`, pois T012/T016 chamam
  essas funções internamente em laço — não dependem de refazer nada em
  `registrar.tsx`
- **Exclusão em Cascata física (Phase 9, Parte 3)**: histórico, descartado por
  completo pela Fase 11 — não bloqueia nem alimenta nenhuma tarefa posterior
- **Exclusão Lógica Universal (Phase 11, Parte 4)**: depende de T001-T021 (Partes
  1-2) já implementadas, mas **não** depende da Fase 9 (que foi descartada). T033
  (migração) DEVE ser aplicada antes de qualquer teste manual de T037-T047, mas não
  bloqueia escrever o código em si. T034 (tipos) bloqueia T035 (mapeamentos no
  AppStore), que por sua vez bloqueia T036-T041, T043 e T045 (todas em
  `AppStore.tsx`, mesmo arquivo). T037 bloqueia T038 (verificação); T039 bloqueia
  T040 (verificação). T046 depende de T036 já estar pronta (senão o filtro removido
  deixaria notas excluídas aparecerem, caso a query inicial ainda não filtre)
- **Polish (Phase 12)**: depende de todas as histórias e da Fase 11 estarem completas

### User Story Dependencies

- **User Story 1 (P1)**: Concluída — corrigiu os bugs de duplicação que tornariam
  qualquer teste de US2/US3 mais confuso
- **User Story 2 (P1)**: expõe `excluirSessao`, reaproveitada por US4; reescrita pela
  Fase 11 (T037) para exclusão lógica
- **User Story 3 (P2)**: expõe `removerLancamento`, reaproveitada por US5; reescrita
  pela Fase 11 (T039) para exclusão lógica
- **User Story 4 (P2)**: Depende de US2 estar implementada (reaproveita
  `excluirSessao` dentro do laço de `excluirSessoesEmLote`); independente de US5
- **User Story 5 (P2)**: Depende de US3 estar implementada (reaproveita
  `removerLancamento` dentro do laço de `removerLancamentosEmLote`); independente de
  US4 — pode ser feita em paralelo a US4 por outra pessoa, já que edita
  `financeiro.tsx`, não `agenda.tsx`
- **User Story 6 (P1, novo)**: Depende apenas de T033-T036 (migração + tipos +
  filtro de carga); independente de US2-US5, embora reescreva `excluirPaciente` no
  mesmo arquivo que elas tocam
- **User Story 7 (P2, novo)**: Depende apenas de T033-T036; independente de
  US2-US6, mas T045 (busca de nota ativa em `registrarSessao`) é o ponto de contato
  entre US7 e US1/US2 — uma nota excluída por US7 nunca deve ser reativada por uma
  edição de US1

### Parallel Opportunities

- T009/T010 (já feitas) e T020/T021 podem ser feitas em paralelo entre si
- T012 (`AppStore.tsx`) e T013-T014 (`agenda.tsx`) podem começar em paralelo por
  pessoas diferentes, já que T015 (a única que depende de ambas) é a última da
  História 4
- Pelo mesmo motivo, T016 (`AppStore.tsx`) e T017-T018 (`financeiro.tsx`) podem
  começar em paralelo
- **US4 e US5 podem ser feitas inteiramente em paralelo** por pessoas diferentes,
  pois tocam arquivos completamente distintos (`agenda.tsx` vs. `financeiro.tsx`,
  mais métodos distintos em `AppStore.tsx` que não se sobrepõem)
- Na Fase 11: T033 (migração) não tem dependência de código, pode ser aplicada em
  paralelo a T034 (tipos); T042 e T044 (ambas em `paciente/[id]/index.tsx`) podem
  ser feitas em paralelo entre si, mas ambas dependem de T041/T043 (AppStore) já
  prontas; T047 (`mock.ts`) é totalmente independente e pode ser feita em paralelo a
  tudo; T037, T039, T041, T043 e T045 são sequenciais entre si (mesmo arquivo
  `AppStore.tsx`, mesmas funções/vizinhança de código)
- T031/T032 (histórico) e T048/T049 (Fase 11) podem ser feitas em paralelo entre si

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 3: User Story 1 (T001-T004) — corrige os bugs relatados ✅ feito
2. **PARAR e VALIDAR**: cenários 1-2 de `quickstart.md`
3. Entregar/demonstrar se pronto (já resolve a reclamação original do usuário)

### Incremental Delivery

1. User Story 1 → testar isoladamente → Demo (corrige os bugs de duplicação) ✅ feito
2. User Story 2 → testar isoladamente (cenários 3-4) → Demo (exclusão de sessão) ✅ feito
3. User Story 3 → testar isoladamente (cenário 5) → Demo (remover só o lançamento) ✅ feito
4. User Story 4 → testar isoladamente (cenário 7) → Demo (exclusão em lote de sessões)
5. User Story 5 → testar isoladamente (cenário 8) → Demo (remoção em lote de
   lançamentos) — pode ser feita em paralelo à História 4
6. ~~Fase 9 (Parte 3)~~ → descartada sem chegar a produção; substituída pela Fase 11
7. Fase 11 (Parte 4) → aplicar a migração (T033) → generalizar `AppStore` (T034-T041,
   T043, T045) e telas (T042, T044, T046) → testar isoladamente os cenários 4, 9 e 10
   (revisados/novos) → Demo (exclusão lógica universal, incluindo paciente e nota
   individual)
8. Fase de Polish (re-lint, re-typecheck após a Fase 11, cenário 6 de bloqueio
   offline estendido a todas as ações desta funcionalidade)

---

## Notes

- [P] = arquivos diferentes, sem dependência de tarefa incompleta
- Sem testes automatizados solicitados — validação manual via `quickstart.md`
- Commitar após cada tarefa ou grupo lógico de tarefas
- A Fase 9 (Parte 3) nunca chegou a ser aplicada em produção e foi descartada por
  completo pela Fase 11 (Parte 4) — suas tarefas `[X]` documentam uma implementação
  histórica substituída, não um trabalho ainda em vigor
