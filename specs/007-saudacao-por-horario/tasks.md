---
description: "Task list for feature implementation"
---

# Tasks: Saudação de boas-vindas por horário

**Input**: Design documents from `/specs/007-saudacao-por-horario/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (sem contracts/ — feature sem interface externa)

**Tests**: Não solicitados na spec. O repositório não tem runner de testes automatizados; a verificação é manual via `quickstart.md`, além de lint e typecheck.

**Organization**: Tarefas agrupadas por user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story a que a tarefa pertence (US1, US2)

## Path Conventions

Projeto mobile único (Expo Router): hooks em `src/hooks/`, rotas em `src/app/`.

---

## Phase 1: Setup

- [x] T001 Confirmar que `npx tsc --noEmit` e `npx expo lint` passam antes de qualquer alteração (ponto de partida limpo)

---

## Phase 2: Foundational

Nenhuma tarefa bloqueante: a feature não tem infraestrutura compartilhada nova.

---

## Phase 3: User Story 1 - Saudação correta para o momento do dia (Priority: P1) 🎯 MVP

**Goal**: A tela Início mostra "Bom dia", "Boa tarde" ou "Boa noite" conforme o horário local, seguida do primeiro nome.

**Independent Test**: Abrir a aba Início com o horário do dispositivo em 08:00, 14:00, 20:00 e 02:00 e nas fronteiras 04:59/05:00/11:59/12:00/17:59/18:00 (quickstart cenários 1 e 2).

- [x] T002 [US1] Criar `src/hooks/useSaudacao.ts` exportando `useSaudacao(): 'Bom dia' | 'Boa tarde' | 'Boa noite'`, que lê `new Date().getHours()` (relógio local) e retorna: `5 <= h < 12` → "Bom dia"; `12 <= h < 18` → "Boa tarde"; `h >= 18` ou `h < 5` → "Boa noite" (fronteira inferior inclusiva, conforme `data-model.md`). Sem `any`; estilo e comentário de documentação em português como em `src/hooks/useProximaSessao.ts`.
- [x] T003 [US1] Em `src/app/(tabs)/inicio.tsx`, importar `useSaudacao` de `@/hooks/useSaudacao`, chamá-lo junto aos demais hooks do componente `Inicio` (antes de qualquer early return) e trocar `<Display>Bom dia, {primeiroNomeUsuario}</Display>` por `<Display>{saudacao}, {primeiroNomeUsuario}</Display>`.

**Checkpoint**: US1 funcional — saudação correta ao abrir a tela.

---

## Phase 4: User Story 2 - Saudação acompanha a passagem do tempo (Priority: P2)

**Goal**: A saudação se atualiza sozinha com o app aberto (até 10 min) e imediatamente ao voltar do segundo plano.

**Independent Test**: Quickstart cenários 3 e 4.

- [x] T004 [US2] Em `src/hooks/useSaudacao.ts`, tornar o valor reativo: guardar a saudação em estado e, num `useEffect`, (a) agendar `setInterval` de 10 minutos (`10 * 60_000`) que recalcula a saudação e (b) assinar `AppState.addEventListener('change', ...)` de `react-native` para recalcular quando o estado virar `'active'`. Fazer cleanup de ambos (`clearInterval` e `subscription.remove()`). Não adicionar dependências.

**Checkpoint**: US1 e US2 funcionais.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T005 Rodar `npx tsc --noEmit` e `npx expo lint`; corrigir qualquer erro ou aviso nos arquivos alterados
- [ ] T006 Executar os cenários de `specs/007-saudacao-por-horario/quickstart.md` em simulador/dispositivo; se algum não puder ser exercitado, declarar a limitação ao reportar a conclusão

---

## Dependencies & Execution Order

- Phase 1 → Phase 3 (US1) → Phase 4 (US2) → Phase 5.
- T003 depende de T002. T004 depende de T002 (altera o mesmo arquivo, portanto não é paralelo).
- US2 estende o hook criado em US1; US1 é entregável sozinha (MVP).

### Parallel Opportunities

Nenhuma: as tarefas tocam os mesmos dois arquivos em sequência.

## Implementation Strategy

1. T001 → T002 → T003: entrega o MVP (saudação correta ao abrir).
2. Validar quickstart cenários 1–2.
3. T004: adiciona a atualização contínua; validar cenários 3–4.
4. T005–T006: lint, typecheck e validação manual final.
