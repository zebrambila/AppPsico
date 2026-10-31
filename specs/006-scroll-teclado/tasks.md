---
description: "Task list template for feature implementation"
---

# Tasks: Scroll Automático com Teclado

**Input**: Design documents from `/specs/006-scroll-teclado/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md (sem data-model.md/contracts/ — feature sem entidades de dados nem interface externa)

**Tests**: Não solicitados explicitamente na spec. Este repositório não tem runner de testes automatizados configurado; a verificação é manual, via os cenários de `quickstart.md`, conforme `research.md`/`plan.md`.

**Organization**: Tarefas agrupadas por user story para permitir implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: A qual user story a tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos estão incluídos em cada descrição

## Path Conventions

Projeto mobile único (Expo Router): código de rota em `src/app/`, componentes
compartilhados em `src/components/`, conforme `plan.md` → Project Structure.

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de qualquer alteração

- [X] T001 Rodar `npx expo lint` e `npx tsc --noEmit` na raiz do repositório (`package.json`) para confirmar que não há erros pré-existentes antes de iniciar as mudanças.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Corrigir os componentes compartilhados de tela dos quais todas as user
stories dependem (`Screen`, `AuthScreen`, `PacienteForm`). Sem isso, nenhuma user story
pode ser verificada corretamente, pois a causa raiz do bug mora aqui.

**⚠️ CRITICAL**: Nenhuma verificação de user story pode começar antes desta fase estar completa.

- [X] T002 Atualizar `Screen` em `src/components/ui.tsx`: envolver o `ScrollView` existente (linhas ~66-72) com um `KeyboardAvoidingView` (`behavior={Platform.OS === 'ios' ? 'padding' : undefined}`, mesmo padrão de `src/components/AuthScreen.tsx:11`) **e** adicionar o comportamento de fechar o teclado ao tocar fora de qualquer campo (toque em área vazia chama `Keyboard.dismiss()`), preservando `keyboardShouldPersistTaps="handled"` para que toques em campos, botões e pills continuem funcionando com um único toque (FR-002, FR-004, FR-007).
- [X] T003 [P] Adicionar o mesmo comportamento de fechar o teclado ao tocar fora em `AuthScreen` (`src/components/AuthScreen.tsx`), para consistência com `Screen` (FR-004); o `KeyboardAvoidingView`+`ScrollView` que já faz o ajuste de scroll em `AuthScreen` permanece inalterado.
- [X] T004 Remover o `ScrollView` raiz aninhado em `PacienteForm` (`src/components/PacienteForm.tsx:62`) e substituí-lo por um `View` com o mesmo `style={{ gap: 16 }}`, eliminando o aninhamento vertical de `ScrollView`s dentro do `ScrollView` de `Screen` (depende de T002 — o `ScrollView` externo de `Screen` precisa já tratar o teclado antes de remover o interno).

**Checkpoint**: Componentes compartilhados corrigidos — as user stories podem ser verificadas a partir daqui.

---

## Phase 3: User Story 1 - Preencher formulário longo sem perder campos (Priority: P1) 🎯 MVP

**Goal**: Ao tocar em um campo próximo ao final de um formulário, a tela rola
automaticamente para que o campo fique visível acima do teclado; tocar fora de um campo
fecha o teclado.

**Independent Test**: Abrir uma tela com formulário (cadastro de paciente ou registro
de sessão), tocar em um campo de texto na parte inferior da tela e verificar que o
campo e seu label permanecem visíveis e acessíveis com o teclado aberto.

### Implementation for User Story 1

- [X] T005 [US1] Atualizar `src/app/sessao/nova.tsx`: envolver seu `ScrollView` próprio (linhas 59-159) com um `KeyboardAvoidingView` (mesmo `behavior` de T002) e adicionar o mesmo comportamento de fechar o teclado ao tocar fora, já que esta tela monta seu próprio `ScrollView` em vez de usar `Screen` (FR-002, FR-004, FR-007).

### Verification for User Story 1 (via `quickstart.md`)

- [ ] T006 [US1] Executar manualmente os cenários 1-3 de `specs/006-scroll-teclado/quickstart.md` (campo visível ao focar, scroll acompanha troca de foco, tocar fora fecha o teclado) em `src/app/paciente/novo.tsx`, `src/app/paciente/[id]/editar.tsx`, `src/app/sessao/registrar.tsx` e `src/app/sessao/nova.tsx`.
- [ ] T007 [US1] Executar manualmente o cenário 6 de `specs/006-scroll-teclado/quickstart.md` (campo multilinha "Anotações da sessão" crescendo em altura) em `src/app/sessao/registrar.tsx`, confirmando que o scroll acompanha o crescimento do campo.
- [ ] T008 [US1] Executar manualmente os cenários 5 e 8 de `specs/006-scroll-teclado/quickstart.md` (sem espaço em branco com teclado fechado; busca de pacientes fora do escopo, sem regressão) em `src/app/paciente/[id]/editar.tsx` e `src/app/(tabs)/pacientes.tsx`.

**Checkpoint**: User Story 1 completa e testável de forma independente — MVP entregável.

---

## Phase 4: User Story 2 - Botões de ação (salvar/confirmar) sempre acessíveis (Priority: P2)

**Goal**: Com o teclado aberto, o usuário consegue rolar manualmente até o botão de
ação final e tocá-lo sem precisar fechar o teclado primeiro.

**Independent Test**: Em uma tela de formulário, abrir o teclado em um campo
intermediário, rolar manualmente a tela até o botão de ação na parte inferior e
confirmar que o botão está visível e clicável.

### Verification for User Story 2 (via `quickstart.md`)

- [ ] T009 [US2] Executar manualmente o cenário 4 de `specs/006-scroll-teclado/quickstart.md` (botão de ação acessível com teclado aberto) em `src/app/paciente/novo.tsx`, `src/app/sessao/registrar.tsx` e `src/app/sessao/nova.tsx`. Se o botão de ação ainda ficar obscurecido após o scroll manual em alguma tela, aumentar o `paddingBottom` do `contentContainerStyle` correspondente (`styles.screenContent` em `src/components/ui.tsx`, o `ScrollView` de `src/components/PacienteForm.tsx`, ou o `contentContainerStyle` de `src/app/sessao/nova.tsx`) até o botão ficar livre do teclado.

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente.

---

## Phase 5: User Story 3 - Comportamento consistente entre plataformas (Priority: P3)

**Goal**: O ajuste de scroll ao abrir o teclado é consistente entre iOS e Android, sem
saltos abruptos, sobreposições ou áreas em branco excessivas.

**Independent Test**: Repetir os testes da User Story 1 em um dispositivo/simulador iOS
e em um dispositivo/emulador Android, comparando se o campo focado fica visível em
ambos sem comportamento visualmente quebrado.

### Verification for User Story 3 (via `quickstart.md`)

- [ ] T010 [US3] Repetir os cenários 1 e 4 de `specs/006-scroll-teclado/quickstart.md` em um simulador iOS e em um emulador/dispositivo Android, confirmando comportamento equivalente (sem sobreposição do teclado, sem espaço em branco excessivo) nas duas plataformas (SC-003, SC-004).

**Checkpoint**: Todas as user stories funcionam de forma independente nas duas plataformas.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirmação final dos portões de qualidade do projeto antes de considerar a feature concluída.

- [X] T011 [P] Rodar `npx expo lint` e `npx tsc --noEmit` na raiz do repositório (`package.json`) após todas as mudanças, confirmando que os portões de qualidade da constituição (Princípio II) continuam verdes.
- [ ] T012 Rodar `specs/006-scroll-teclado/quickstart.md` do início ao fim (todos os 8 cenários, nas duas plataformas) como validação final de release.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente.
- **Foundational (Phase 2)**: Depende de Setup. BLOQUEIA todas as user stories (a causa raiz do bug está em `Screen`/`AuthScreen`/`PacienteForm`).
- **User Stories (Phase 3-5)**: Todas dependem da conclusão da fase Foundational.
  - US1 (Phase 3) deve ser concluída antes de rodar as verificações de US2 e US3 (T009, T010), pois ambas reexecutam/dependem dos cenários e das correções de US1.
- **Polish (Phase 6)**: Depende de todas as user stories desejadas estarem completas.

### User Story Dependencies

- **User Story 1 (P1)**: Depende apenas da fase Foundational.
- **User Story 2 (P2)**: Depende da fase Foundational e de T005 (US1); não introduz código novo, apenas verifica um comportamento que a correção de US1 já habilita.
- **User Story 3 (P3)**: Depende da fase Foundational e de T005 (US1); é puramente uma repetição multiplataforma das verificações de US1/US2.

### Within Each User Story

- A implementação (T005) vem antes das verificações (T006-T008) na User Story 1.
- User Stories 2 e 3 são somente verificação — nenhuma implementação própria é necessária, pois reaproveitam as correções de T002-T005.

### Parallel Opportunities

- T003 (`AuthScreen.tsx`) pode rodar em paralelo com T002 (`ui.tsx`) — arquivos diferentes.
- T011 pode rodar em paralelo com T012, já que `lint`/`tsc` não interferem na validação manual do quickstart.
- As verificações T006, T007 e T008 (todas [US1]) tocam telas diferentes e podem ser feitas em paralelo por pessoas diferentes, mas todas dependem de T002, T004 e T005 já estarem concluídas.

---

## Parallel Example: Phase 2 (Foundational)

```bash
# T002 e T003 podem ser feitas em paralelo (arquivos diferentes):
Task: "Atualizar Screen em src/components/ui.tsx: KeyboardAvoidingView + fechar teclado ao tocar fora"
Task: "Adicionar fechar teclado ao tocar fora em src/components/AuthScreen.tsx"

# T004 só começa depois que T002 terminar (mesma cadeia de ScrollView pai/filho):
Task: "Remover ScrollView aninhado em src/components/PacienteForm.tsx (depende de T002)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup.
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia todas as user stories).
3. Completar Phase 3: User Story 1.
4. **PARAR e VALIDAR**: rodar os cenários 1-3, 5, 6 e 8 de `quickstart.md` em ambos os formulários de paciente e sessão.
5. Esse é o MVP: resolve diretamente o problema relatado pelo usuário (campos inferiores encobertos pelo teclado).

### Incremental Delivery

1. Setup + Foundational → base corrigida nos componentes compartilhados.
2. Adicionar User Story 1 → validar independentemente → já resolve o problema original relatado.
3. Adicionar User Story 2 → validar independentemente → confirma que o botão de ação final permanece alcançável.
4. Adicionar User Story 3 → validar independentemente → confirma paridade entre iOS e Android.
5. Cada story adiciona confiança sem exigir código adicional além do que a Foundational + US1 já entregaram.

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências entre si.
- [Story] label mapeia a tarefa à user story correspondente para rastreabilidade.
- Sem testes automatizados neste repositório: a verificação de cada user story é feita via os cenários nomeados de `quickstart.md`, não via arquivos de teste.
- `npx expo lint` e `npx tsc --noEmit` DEVEM passar sem erros antes de qualquer tarefa ser considerada concluída (Constituição, Princípio II).
- Rodar o app em simulador/emulador/Expo Go é obrigatório para validar esta feature — passar lint/tsc não é evidência suficiente de que o comportamento de UI funciona (Constituição, Fluxo de Desenvolvimento).
