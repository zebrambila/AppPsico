---
description: "Task list template for feature implementation"
---

# Tasks: Persistência Real de Pacientes, Sessões e Financeiro

**Input**: Design documents from `/specs/004-persistir-dados-clinicos/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Não solicitados na especificação (nenhum framework de testes automatizados
configurado no projeto — ver `plan.md`). Validação manual pelos 8 cenários de
`quickstart.md`, na Fase final.

**Organization**: Tarefas agrupadas por história de usuário para permitir
implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual história de usuário a tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos estão incluídos em cada descrição

## Path Conventions

Projeto único (Expo/React Native). Rotas em `src/app/`, componentes/hooks/store fora
de `src/app/`, conforme `plan.md` → Project Structure. Backend é o Supabase hospedado,
schema aplicado por SQL manual (`contracts/schema.sql`), não por código neste repositório.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Criar a estrutura de dados real no Supabase antes de qualquer código
cliente poder gravar nela.

- [X] T001 Aplicar o script `specs/004-persistir-dados-clinicos/contracts/schema.sql`
  no SQL Editor do painel do Supabase (projeto já usado pela spec 002): cria as
  tabelas `pacientes`, `sessoes`, `lancamentos`, `notas`, seus índices, e as 4
  políticas de RLS (`select`/`insert`/`update`/`delete`, cada uma restrita a
  `psicologa_id = auth.uid()`) por tabela. Confirmar no painel que RLS está habilitado
  nas 4 tabelas antes de prosseguir (FR-003, Princípio III)

**Checkpoint**: Tabelas reais disponíveis para a Fase Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Trocar a fonte de leitura do `AppStore` de `src/data/mock.ts` para o
Supabase, e criar o formulário de paciente compartilhado — infraestrutura usada pelas
3 histórias.

**⚠️ CRITICAL**: Nenhuma história de usuário pode ser finalizada até esta fase estar completa.

- [X] T002 Em `src/store/AppStore.tsx`, substituir os `useState` inicializados a
  partir de `pacientesIniciais`/`sessoesIniciais`/`lancamentosIniciais`/`notasIniciais`
  (de `src/data/mock.ts`) por um carregamento via `supabase.from('pacientes').select()`,
  `.from('sessoes').select()`, `.from('lancamentos').select()`, `.from('notas').select()`
  disparado quando `useAuth().usuario` estiver definido; expor um novo campo
  `carregando: boolean` no contexto (`true` até as 4 consultas resolverem). RLS já
  garante que cada consulta retorna só as linhas da conta autenticada — nenhum filtro
  manual por conta é necessário no cliente (FR-003; ver `contracts/app-store.md`)
- [X] T003 [P] Criar `src/components/PacienteForm.tsx`: formulário com campos nome
  (texto obrigatório), frequência (`Pill`/`Segmented` com as opções exatas
  `'Semanal'`, `'Quinzenal'`, `'Mensal'`), dia fixo (seletor 0–6, rótulos
  Dom–Sáb), hora fixa (texto no formato `HH:MM`, validado com `horaValida()` de
  `src/lib/format.ts`), modalidade (`'Presencial'`|`'Online'`), valor da sessão
  (numérico ≥ 0), desde (data `AAAA-MM-DD`) e telefone (texto obrigatório);
  reaproveita `FormField` (já usado em `src/app/(auth)/cadastro.tsx`); recebe
  `valoresIniciais?: Partial<NovoPacienteInput>` e `onSalvar: (dados: NovoPacienteInput) => Promise<void>`
  como props, para servir tanto o cadastro (T007) quanto a edição (T009)

**Checkpoint**: Fundação pronta — as histórias de usuário podem ser implementadas.

---

## Phase 3: User Story 1 - Cadastrar pacientes que permanecem salvos (Priority: P1) 🎯 MVP

**Goal**: Cadastrar, editar e (quando sem histórico) excluir pacientes reais e
persistentes, isolados por conta.

**Independent Test**: Cadastrar um paciente, encerrar e reabrir o app (ou trocar de
conta), e confirmar que ele continua lá só para a conta que o criou; editar um campo e
confirmar persistência; tentar excluir um paciente sem histórico (deve funcionar).

### Implementation for User Story 1

- [X] T004 [US1] Em `src/store/AppStore.tsx`, implementar
  `criarPaciente(input: NovoPacienteInput): Promise<Paciente>`: verifica
  `useConectividade()` antes de chamar `supabase.from('pacientes').insert(...)`
  (incluindo `psicologa_id: usuario.id`), rejeita com mensagem amigável se offline ou
  se o Supabase retornar erro, e em caso de sucesso adiciona o paciente retornado a
  `pacientes` e resolve com ele (FR-001, FR-010)
- [X] T005 [US1] Em `src/store/AppStore.tsx`, implementar
  `editarPaciente(id: string, input: NovoPacienteInput): Promise<void>`: mesma
  checagem de conectividade, `supabase.from('pacientes').update(...).eq('id', id)`,
  atualiza o paciente correspondente em `pacientes` a partir da resposta (FR-002)
- [X] T006 [US1] Em `src/store/AppStore.tsx`, implementar
  `excluirPaciente(id: string): Promise<void>`: mesma checagem de conectividade,
  `supabase.from('pacientes').delete().eq('id', id)`; se o Postgres rejeitar por
  violação de chave estrangeira (código de erro `23503`, ver `research.md` Decisão 2),
  rejeitar com a mensagem "Esse paciente tem sessões, pagamentos ou notas registrados
  e por isso não pode ser excluído."; em caso de sucesso, remover o paciente de
  `pacientes` (FR-009)
- [X] T007 [US1] Criar rota `src/app/paciente/novo.tsx`: usa `PacienteForm` (T003) sem
  `valoresIniciais`, chama `criarPaciente` (T004) em `onSalvar`, navega para
  `paciente/[id]` do paciente criado em caso de sucesso, e deixa o erro em caso de
  falha visível na própria tela (FR-001)
- [X] T008 [US1] Em `src/app/(tabs)/pacientes.tsx`, trocar o `onPress` do botão
  "+ Novo" (hoje `showToast('Cadastro de novo paciente — em breve')`) para
  `router.push('/paciente/novo')`
- [X] T009 [US1] Criar rota `src/app/paciente/[id]/editar.tsx`: usa `PacienteForm`
  (T003) com `valoresIniciais` a partir do paciente atual (via `paciente(id)`), chama
  `editarPaciente` (T005) em `onSalvar`, volta para `paciente/[id]` em caso de sucesso
  (FR-002)
- [X] T010 [US1] Em `src/app/paciente/[id]/index.tsx` (antes `[id].tsx`, convertido
  para permitir a rota aninhada `editar.tsx`), adicionar dois botões: "Editar"
  (navega para `paciente/[id]/editar`) e "Excluir" (pede confirmação, então chama
  `excluirPaciente` (T006); em caso de sucesso volta para a lista de pacientes e
  mostra confirmação via `showToast`; em caso de rejeição por histórico, mostra a
  mensagem de erro sem navegar, mantendo o paciente visível) (FR-009)

**Checkpoint**: User Story 1 funcional e testável de forma independente.

---

## Phase 4: User Story 2 - Agendar sessões reais vinculadas aos pacientes (Priority: P1)

**Goal**: Agendar, confirmar e registrar sessões reais, persistentes, vinculadas a
pacientes reais.

**Independent Test**: Com um paciente real (criado na US1 ou já existente), agendar
uma sessão, confirmá-la, registrá-la como realizada, e confirmar que o status final
persiste após reabrir o app. *(Depende de existir ao menos um paciente real — ver
Dependencies.)*

### Implementation for User Story 2

- [X] T011 [US2] Em `src/store/AppStore.tsx`, implementar
  `agendarSessao(input: NovaSessaoInput): Promise<void>` sobre
  `supabase.from('sessoes').insert([...])` em vez do array em memória, preservando a
  lógica de `repetirSemanal` (gera as próximas 3 ocorrências semanais, como hoje);
  checagem de conectividade antes de chamar; em sucesso, adiciona as sessões criadas a
  `sessoes` a partir da resposta do banco (FR-004, FR-010)
- [X] T012 [US2] Em `src/store/AppStore.tsx`, implementar
  `confirmarSessao(sessaoId: string): Promise<void>` sobre
  `supabase.from('sessoes').update({ status: 'confirmada' }).eq('id', sessaoId)`;
  checagem de conectividade antes; em sucesso, atualiza a sessão correspondente em
  `sessoes` (FR-005, FR-010)
- [X] T013 [US2] Em `src/store/AppStore.tsx`, implementar
  `registrarSessao(input: RegistroSessaoInput): Promise<void>` substituindo a versão
  em memória: grava o novo status da sessão (criando-a via `insert` se `sessaoId` não
  foi informado, ou atualizando via `update` se foi), cria ou substitui o lançamento
  financeiro vinculado quando `presenca === 'compareceu'` (removendo o lançamento
  anterior dessa sessão se `presenca` mudou para outro valor, como a lógica atual já
  faz), e grava a nota quando o texto não estiver vazio — tudo com `psicologa_id` e
  `paciente_id`/`sessao_id` corretos; checagem de conectividade antes de iniciar;
  atualiza `sessoes`/`lancamentos`/`notas` a partir das respostas do banco em caso de
  sucesso (FR-005, FR-006, FR-008, FR-010, FR-012 — nota: esta tarefa também satisfaz
  parte da História 3, já que é aqui que notas e lançamentos são criados)
- [X] T014 [US2] Em `src/app/sessao/nova.tsx` e `src/app/sessao/registrar.tsx`, tratar
  a rejeição das chamadas agora assíncronas (`agendarSessao`/`registrarSessao`)
  capturando o erro e exibindo a mensagem via `showToast` em vez de assumir sucesso
  síncrono como hoje (FR-010)

**Checkpoint**: User Stories 1 e 2 funcionais, cada uma testável independentemente.

---

## Phase 5: User Story 3 - Registrar pagamentos e notas de atendimento persistentes (Priority: P2)

**Goal**: Marcar lançamentos como pagos (ação nova, distinta de "Cobrar") de forma
persistente, fechando o ciclo financeiro de uma sessão.

**Independent Test**: Registrar uma sessão como realizada sem marcar pagamento (fica
em aberto), usar a nova ação "Marcar como pago" na tela Financeiro, e confirmar que o
lançamento passa a pago e persiste após reabrir o app. *(Depende de existir uma
sessão registrada com lançamento em aberto — ver Dependencies.)*

### Implementation for User Story 3

- [X] T015 [US3] Em `src/store/AppStore.tsx`, implementar
  `cobrar(lancamentoId: string): Promise<void>` sobre
  `supabase.from('lancamentos').update({ cobrado: true }).eq('id', lancamentoId)`
  (mesmo comportamento já existente — lembrete de cobrança —, agora persistente);
  checagem de conectividade antes
- [X] T016 [US3] Em `src/store/AppStore.tsx`, implementar a operação nova
  `marcarComoPago(lancamentoId: string, metodo: MetodoPagamento): Promise<void>` sobre
  `supabase.from('lancamentos').update({ pago: true, metodo }).eq('id', lancamentoId)`;
  checagem de conectividade antes; em sucesso, atualiza o lançamento correspondente em
  `lancamentos` (FR-007, FR-010)
- [X] T017 [US3] Em `src/app/(tabs)/financeiro.tsx`, adicionar a ação "Marcar como
  pago" (botão que abre uma seleção de método via `Pill`/`Segmented`, com as opções
  `'Pix'`, `'Cartão'`, `'Dinheiro'`, `'Convênio'`) para lançamentos em aberto, chamando
  `marcarComoPago` (T016) — ação nova e visualmente distinta do botão "Cobrar" já
  existente na mesma linha (FR-007)
- [X] T018 [US3] Em `src/app/(tabs)/financeiro.tsx`, tratar a rejeição de
  `cobrar`/`marcarComoPago` exibindo a mensagem de erro via `showToast` em vez de
  assumir sucesso síncrono (FR-010). `src/app/paciente/[id]/index.tsx` não chama
  nenhuma das duas operações (tela somente leitura do financeiro do paciente), então
  nenhuma mudança é necessária lá

**Checkpoint**: Todas as histórias de usuário funcionais de forma independente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Portões de qualidade da Constituição e validação manual final.

- [X] T019 [P] Rodar `npx expo lint` a partir da raiz do repositório e corrigir todos
  os erros/avisos resultantes das mudanças desta funcionalidade
- [X] T020 [P] Rodar `npx tsc --noEmit` a partir da raiz do repositório e corrigir
  todos os erros de tipo resultantes das mudanças desta funcionalidade
- [ ] T021 Executar manualmente os 8 cenários de
  `specs/004-persistir-dados-clinicos/quickstart.md` (cadastro/edição de paciente,
  isolamento entre contas, agendamento e progresso de sessão, pagamento e nota,
  marcar como pago, bloqueio de exclusão com histórico, bloqueio de escrita offline)
  com pelo menos duas contas de psicóloga diferentes — **PENDENTE**: verificação
  automatizada parcial feita via `npx expo start --web` (bundle de 857 módulos
  compilado sem erros após todas as mudanças), mas a validação interativa com dados
  reais do Supabase e duas contas distintas ainda não foi executada nesta sessão

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências de código — mas é um pré-requisito de dados:
  nenhuma chamada ao Supabase das fases seguintes funciona sem as tabelas/RLS criadas
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA as 3 histórias
- **User Stories (Phase 3-5)**: Todas dependem da conclusão da Fase Foundational
- **Polish (Phase 6)**: Depende de todas as histórias desejadas estarem completas

### User Story Dependencies

- **User Story 1 (P1)**: Pode começar após a Fase Foundational — sem dependência de
  outras histórias; é a única forma de ter um paciente real para testar US2/US3 (ou
  usar um paciente inserido manualmente no Supabase para testar US2/US3 em paralelo
  antes de US1 estar pronta)
- **User Story 2 (P1)**: Funcionalmente independente de US1, mas precisa de ao menos
  um paciente real já existente para ser exercitada de ponta a ponta — na prática,
  valide US1 primeiro ou insira um paciente de teste diretamente no Supabase
- **User Story 3 (P2)**: Depende de uma sessão registrada com lançamento em aberto
  (produzida pela T013 de US2) para ter o que marcar como pago — dependência funcional
  de dados, não de código
- Todas as três histórias editam o mesmo arquivo `src/store/AppStore.tsx` (métodos
  diferentes) e por isso devem ser implementadas em sequência por uma mesma pessoa, ou
  com atenção a conflitos de merge se paralelizada entre pessoas

### Parallel Opportunities

- T003 (novo arquivo `PacienteForm.tsx`) pode ser feita em paralelo a T002 (ambas na
  Fase Foundational, arquivos diferentes)
- T007 (nova rota `paciente/novo.tsx`) e T009 (nova rota `paciente/[id]/editar.tsx`)
  são arquivos diferentes entre si, mas ambas dependem de T003 e dos métodos T004/T005
  respectivamente
- T019 e T020 podem ser feitas em paralelo
- Todas as demais tarefas de cada história editam `src/store/AppStore.tsx` e/ou as
  telas existentes e devem ser feitas em sequência dentro da história

---

## Parallel Example: Foundational Phase

```bash
# Arquivos diferentes, sem dependência entre si:
Task: "Reescrever a leitura de dados do AppStore para o Supabase em src/store/AppStore.tsx"
Task: "Criar o formulário compartilhado PacienteForm em src/components/PacienteForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 1: Setup (T001 — aplicar o schema no Supabase)
2. Completar Fase 2: Foundational (T002-T003) — CRÍTICO, bloqueia as histórias
3. Completar Fase 3: User Story 1 (T004-T010)
4. **PARAR e VALIDAR**: cenários 1–3 de `quickstart.md` (cadastrar, editar, isolamento
   entre contas)
5. Entregar/demonstrar se pronto

### Incremental Delivery

1. Setup + Foundational → tabelas reais + formulário compartilhado prontos
2. Adicionar User Story 1 → testar isoladamente (cenários 1–3) → Demo (MVP!)
3. Adicionar User Story 2 → testar isoladamente (cenário 4, usando um paciente da US1)
   → Demo
4. Adicionar User Story 3 → testar isoladamente (cenários 5–6, usando uma sessão da
   US2) → Demo
5. Fase de Polish (lint, typecheck, quickstart completo incluindo cenários 7–8:
   bloqueio de exclusão e bloqueio offline)

---

## Notes

- [P] = arquivos diferentes, sem dependência de tarefa incompleta
- [Story] mapeia a tarefa à história de usuário correspondente para rastreabilidade
- Sem testes automatizados solicitados nesta funcionalidade — validação manual via
  `quickstart.md` na Fase 6
- Commitar após cada tarefa ou grupo lógico de tarefas
- Parar em qualquer checkpoint para validar a história isoladamente
- O script `contracts/schema.sql` (T001) é aplicado uma única vez no painel do
  Supabase — não há comando de projeto para isso, é uma ação manual fora do código
