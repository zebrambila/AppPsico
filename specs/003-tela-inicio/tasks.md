---
description: "Task list template for feature implementation"
---

# Tasks: Tela de Início (Painel do Dia)

**Input**: Design documents from `/specs/003-tela-inicio/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Não solicitados na especificação (nenhum framework de testes automatizados está configurado no projeto — ver `plan.md`, seção Testing). A validação é manual, pelos cenários de `quickstart.md`, na Fase final.

**Organization**: Tarefas agrupadas por história de usuário para permitir implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual história de usuário a tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos estão incluídos em cada descrição

## Path Conventions

Projeto único (Expo/React Native). Rotas em `src/app/`, componentes/hooks fora de
`src/app/`, conforme `plan.md` → Project Structure.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar a dependência nova exigida pela Decisão 1 de `research.md`.

- [X] T001 Instalar `expo-network` com `npx expo install expo-network` (atualiza `package.json`/`package-lock`); confirmar que o app ainda inicia com `npx expo start` após a instalação

**Checkpoint**: Dependência disponível para a Fase Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura usada por todas as histórias — gate de conectividade
(bloqueia a tela inteira quando offline) e o componente de valor mascarado (usado
pelas histórias US1, US2 e US3).

**⚠️ CRITICAL**: Nenhuma história de usuário pode ser finalizada até esta fase estar completa.

- [X] T002 [P] Criar hook `src/hooks/useConectividade.ts` que usa `useNetworkState()` de
  `expo-network` e retorna `true` quando há conexão utilizável e `false` quando
  `isConnected === false` ou `isInternetReachable === false` (FR-014; ver `research.md`
  Decisão 1)
- [X] T003 [P] Criar componente `src/components/ValorMascarado.tsx`: props
  `{ valor: string; visivel: boolean; onToggle: () => void }`; renderiza `••••` quando
  `visivel === false` e `valor` quando `true`; expõe um controle tocável (ícone de
  olho via `Feather`, `accessibilityRole="button"`, `accessibilityLabel` indicando
  "mostrar"/"ocultar valor") que chama `onToggle` (FR-003, FR-004; ver `research.md`
  Decisão 4)
- [X] T004 Integrar `useConectividade` em `src/app/(tabs)/inicio.tsx`: quando retornar
  `false`, renderizar dentro de `<Screen>` um estado de bloqueio reaproveitando
  `EmptyState` de `src/components/ui.tsx` (título indicando falta de conexão, subtítulo
  pedindo para verificar a internet) **no lugar de** todo o conteúdo normal da tela
  (saudação, destaque, listas); quando retornar `true`, renderizar o conteúdo normal
  (FR-014) (depende de T002)

**Checkpoint**: Fundação pronta — as histórias de usuário podem ser implementadas.

---

## Phase 3: User Story 1 - Ver o resumo do dia ao abrir o app (Priority: P1) 🎯 MVP

**Goal**: Saudação com nome e data, contagem de sessões do dia/realizadas, e valor
total a receber mascarado por padrão com controle de revelar.

**Independent Test**: Entrar com sessões e pagamentos cadastrados para hoje; abrir a
tela de Início e confirmar saudação, data, contagens, e que o valor a receber aparece
oculto até tocar para revelar.

### Implementation for User Story 1

- [X] T005 [US1] Em `src/app/(tabs)/inicio.tsx`, adicionar estado local
  `const [valorReceberVisivel, setValorReceberVisivel] = useState(false)` e resetá-lo
  para `false` dentro de um `useFocusEffect` (importado de `expo-router`) disparado a
  cada vez que a tela ganha foco (FR-016)
- [X] T006 [US1] Em `src/app/(tabs)/inicio.tsx`, substituir a exibição direta de
  `{moeda(aReceber)}` no card estatístico "a receber" por `<ValorMascarado valor={moeda(aReceber)} visivel={valorReceberVisivel} onToggle={() => setValorReceberVisivel(v => !v)} />`,
  mantendo inalterado o `onPress` que navega para `/financeiro` com
  `params: { filtro: 'pendentes' }` (FR-003) (depende de T003, T005)
- [X] T007 [US1] Em `src/app/(tabs)/inicio.tsx`, confirmar que a saudação
  (`Bom dia, {primeiroNomeUsuario}` + `fmtCabecalho(hoje)`) e as contagens
  `deHoje.length` / `realizadas` permanecem exibidas normalmente quando há conexão
  (FR-001, FR-002), ajustando apenas a posição relativa ao bloco de conectividade de
  T004 se necessário

**Checkpoint**: User Story 1 funcional e testável de forma independente.

---

## Phase 4: User Story 2 - Agir rapidamente sobre a próxima sessão (Priority: P1)

**Goal**: Destaque da próxima sessão (horário, paciente, modalidade, duração, valor
mascarado) que se atualiza automaticamente enquanto a tela fica aberta, com atalhos
para ficha do paciente e registro de sessão.

**Independent Test**: Criar uma sessão confirmada/pendente para hoje; abrir a tela de
Início e confirmar os dados do destaque e os atalhos "Abrir ficha"/"Registrar";
avançar o horário atual além do horário da sessão sem recarregar a tela e confirmar
que o destaque troca para a próxima sessão elegível automaticamente.

### Implementation for User Story 2

- [X] T008 [P] [US2] Criar hook `src/hooks/useProximaSessao.ts`: recebe `sessoes: Sessao[]`
  do dia já filtradas (`sessoesDoDia`) e retorna a sessão com status `'confirmada'` ou
  `'pendente'` mais próxima do horário atual; mantém um estado interno de "agora"
  atualizado por `setInterval` (~30s), limpo no `unmount` (FR-015; ver `research.md`
  Decisão 3)
- [X] T009 [US2] Em `src/app/(tabs)/inicio.tsx`, substituir o cálculo atual de
  `proxima` (`deHoje.find(...)`, calculado uma única vez por render) pela chamada ao
  hook `useProximaSessao(deHoje)` (depende de T008)
- [X] T010 [US2] Em `src/app/(tabs)/inicio.tsx`, adicionar estado local
  `valorProximaSessaoVisivel` (padrão `false`), resetado para `false` tanto no mesmo
  `useFocusEffect` de T005 quanto quando o id da sessão em destaque mudar — implementado
  como ajuste de estado durante a renderização (padrão React recomendado para resetar
  estado a partir de uma prop/valor derivado) em vez de `useEffect`, para não acionar o
  lint `react-hooks/set-state-in-effect` (FR-016)
- [X] T011 [US2] Em `src/app/(tabs)/inicio.tsx`, substituir a exibição direta de
  `{proxima.duracaoMin} min · R$ {proxima.valor}` por duração visível + `<ValorMascarado
  valor={moeda(proxima.valor)} visivel={valorProximaSessaoVisivel} onToggle={...} />`,
  mantendo horário, nome do paciente, modalidade e os botões "Abrir ficha"/"Registrar"
  (que chamam `abrirPaciente`/`registrar`) inalterados (FR-004, FR-006) (depende de
  T003, T010)

**Checkpoint**: User Stories 1 e 2 funcionais, cada uma testável independentemente.

---

## Phase 5: User Story 3 - Resolver pendências do dia sem sair da tela de Início (Priority: P2)

**Goal**: Seção de pendências com sessões de hoje não confirmadas (com confirmação
direta) e resumo de pagamentos em aberto, ou indicação de que tudo está em dia.

**Independent Test**: Criar uma sessão de hoje com status `pendente`; confirmar que
ela aparece na seção de pendências com o botão "Confirmar", que ao ser tocado atualiza
o status e mostra confirmação visual; remover todas as pendências e confirmar o
indicador "Tudo em dia".

### Implementation for User Story 3

- [X] T012 [US3] Em `src/app/(tabs)/inicio.tsx`, no card de pagamentos em aberto dentro
  da seção "Pendências" (`IconBox icon="dollar-sign"` + texto "Total de..."),
  substituir `{moeda(aReceber)}` por `<ValorMascarado>` controlado pelo **mesmo** estado
  `valorReceberVisivel` criado em T005 (é o mesmo total "a receber" exibido em dois
  lugares da tela, então compartilha o mesmo estado de visibilidade) (FR-010) (depende
  de T003, T005)
- [X] T013 [US3] Em `src/app/(tabs)/inicio.tsx`, confirmar que a lista `aConfirmar.map(...)`
  (sessões pendentes de confirmação) e o botão "Confirmar" (que chama `confirmarSessao(s.id)`
  e `showToast(...)`) continuam funcionando normalmente quando há conexão (FR-009,
  FR-013)
- [X] T014 [US3] Em `src/app/(tabs)/inicio.tsx`, confirmar que o `Chip label="Tudo em dia"
  tone="success"` é exibido quando `abertos.length === 0 && aConfirmar.length === 0`
  (FR-011)

**Checkpoint**: Todas as histórias de usuário funcionais de forma independente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Portões de qualidade da Constituição e validação manual final.

- [X] T015 [P] Rodar `npx expo lint` a partir da raiz do repositório e corrigir todos os
  erros/avisos resultantes das mudanças desta funcionalidade
- [X] T016 [P] Rodar `npx tsc --noEmit` a partir da raiz do repositório e corrigir todos
  os erros de tipo resultantes das mudanças desta funcionalidade
- [ ] T017 Executar manualmente os 7 cenários de
  `specs/003-tela-inicio/quickstart.md` (resumo do dia, valor a receber mascarado,
  destaque mascarado, atualização automática da próxima sessão, pendências, bloqueio
  offline, estados vazios) no Expo Go/simulador, incluindo ativar o modo avião e
  ajustar o horário de uma sessão em `src/data/mock.ts` para validar a troca automática
  — **EM ANDAMENTO**: cenário 2/3 (tocar para revelar/ocultar valor mascarado)
  confirmado manualmente pelo usuário em 2026-10-26. Ainda pendentes: bloqueio offline
  (cenário 6), troca automática da próxima sessão (cenário 4) e estados vazios
  (cenário 7)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA as 3 histórias
- **User Stories (Phase 3-5)**: Todas dependem da conclusão da Fase Foundational
- **Polish (Phase 6)**: Depende de todas as histórias desejadas estarem completas

### User Story Dependencies

- **User Story 1 (P1)**: Pode começar após a Fase Foundational — sem dependência de
  outras histórias
- **User Story 2 (P1)**: Pode começar após a Fase Foundational — independente de US1
  no comportamento, mas edita o mesmo arquivo (`inicio.tsx`), então na prática deve ser
  feita em sequência com US1/US3 por uma mesma pessoa, ou com atenção a conflitos de
  merge se paralelizada entre pessoas
- **User Story 3 (P2)**: Depende da Fase Foundational **e** da tarefa T005 (estado
  `valorReceberVisivel` criado em US1), porque reutiliza o mesmo estado para mascarar o
  mesmo valor "a receber" exibido em outro ponto da tela — essa é a única dependência
  cruzada entre histórias nesta funcionalidade

### Parallel Opportunities

- T002 e T003 (arquivos novos e independentes) podem ser feitas em paralelo
- T008 (novo arquivo `useProximaSessao.ts`) pode ser feita em paralelo a T002/T003
- T015 e T016 podem ser feitas em paralelo
- Todas as demais tarefas editam `src/app/(tabs)/inicio.tsx` e devem ser feitas em
  sequência (mesmo arquivo)

---

## Parallel Example: Foundational Phase

```bash
# Com mais de uma pessoa disponível, estas três tarefas são independentes entre si:
Task: "Criar hook useConectividade em src/hooks/useConectividade.ts"
Task: "Criar componente ValorMascarado em src/components/ValorMascarado.tsx"
Task: "Criar hook useProximaSessao em src/hooks/useProximaSessao.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 1: Setup (T001)
2. Completar Fase 2: Foundational (T002-T004) — CRÍTICO, bloqueia as histórias
3. Completar Fase 3: User Story 1 (T005-T007)
4. **PARAR e VALIDAR**: testar User Story 1 isoladamente (saudação, contagens, valor
   mascarado) pelo cenário 1-2 de `quickstart.md`
5. Entregar/demonstrar se pronto

### Incremental Delivery

1. Setup + Foundational → fundação pronta (gate offline + componente de máscara)
2. Adicionar User Story 1 → testar isoladamente → Demo (MVP!)
3. Adicionar User Story 2 → testar isoladamente (inclui aguardar/simular o avanço do
   horário) → Demo
4. Adicionar User Story 3 → testar isoladamente (depende do estado criado em US1) →
   Demo
5. Fase de Polish (lint, typecheck, quickstart completo)

---

## Notes

- [P] = arquivos diferentes, sem dependência de tarefa incompleta
- [Story] mapeia a tarefa à história de usuário correspondente para rastreabilidade
- Sem testes automatizados solicitados nesta funcionalidade — validação manual via
  `quickstart.md` na Fase 6
- Commitar após cada tarefa ou grupo lógico de tarefas
- Parar em qualquer checkpoint para validar a história isoladamente
