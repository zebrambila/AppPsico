# Implementation Plan: Editar e Excluir (Individual e em Lote) Registro de Sessão, Prontuário e Financeiro

**Branch**: `005-editar-excluir-registro` | **Date**: 2026-10-27 | **Revised**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-editar-excluir-registro/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

**Parte 1 (já implementada)**: corrigir dois bugs de duplicação na tela
`src/app/sessao/registrar.tsx` e no `AppStore.registrarSessao` (spec 004) — anotação
que não reaparecia ao reabrir um registro e era duplicada ao salvar, e presença que
não refletia status "remarcada" — e adicionar `excluirSessao`/`removerLancamento`
individuais, bloqueadas por anotação e/ou lançamento vinculado via a restrição
`ON DELETE RESTRICT` já existente no schema da spec 004.

**Parte 2 (já implementada)**: adicionar exclusão **em lote** às listas já
existentes — seleção múltipla de sessões no dia aberto da Agenda, e de lançamentos na
tela Financeiro —, processando cada item individualmente (nunca um único `DELETE`
SQL multi-linha). Nenhuma tabela ou rota nova.

**Parte 3 (planejada, nunca aplicada em produção — substituída por esta revisão)**:
trocar o bloqueio de exclusão de sessão por exclusão em cascata, excluindo de fato o
lançamento vinculado e arquivando (nunca apagando) a nota vinculada. A migração de
schema dessa parte (`ON DELETE CASCADE`/`SET NULL`) nunca foi executada no banco
(tarefa T022 ficou pendente) e **esta revisão a descarta por completo** — nenhuma
coluna ou FK daquela parte chega a existir em produção.

**Parte 4 (revisão desta rodada — exclusão lógica/soft-delete universal)**: nenhuma
das quatro entidades desta funcionalidade (paciente, sessão, lançamento, nota) volta
a ser apagada fisicamente. Toda exclusão — individual ou em lote — passa a ser
lógica: cada tabela ganha uma coluna booleana própria (`excluido`/`excluida`,
inicializada em `false`), e as telas simplesmente deixam de carregar/exibir linhas
marcadas como excluídas. A exclusão em cascata (sessão → lançamento + nota; **novo**:
paciente → sessões + lançamentos + notas) passa a ser uma sequência de `UPDATE`s
marcando `excluido = true`, em vez de `DELETE`s reais ou de FKs `CASCADE`/`SET NULL`.
Esta revisão também adiciona duas capacidades novas pedidas pela usuária: excluir um
paciente (com cascata completa) e excluir uma nota de prontuário individualmente —
ambas antes inexistentes nesta spec.

## Technical Context

**Language/Version**: TypeScript (modo estrito) sobre React Native 0.88 / React 19.3 / Expo SDK 58

**Primary Dependencies**: `@supabase/supabase-js` (já em uso desde a spec 002/004);
`useConectividade` (`src/hooks/useConectividade.ts`, spec 003), reaproveitado para
bloquear as novas ações de escrita sem conexão (FR-009). Nenhuma dependência nova.

**Storage**: Supabase Postgres — mesmas 4 tabelas da spec 004. Esta revisão adiciona
uma coluna booleana de exclusão lógica em cada uma (`pacientes.excluido`,
`sessoes.excluida`, `lancamentos.excluido`, `notas.excluida`), documentada em
`contracts/migracao-exclusao-logica.sql`, aplicada manualmente no SQL Editor do
Supabase (mesmo padrão não-CLI das specs 002/004). Nenhuma FK é alterada — como
nenhuma linha dessas 4 tabelas volta a ser apagada fisicamente por esta
funcionalidade, a ação `ON DELETE` original (`RESTRICT`, da spec 004) nunca chega a
ser acionada e não precisa mudar.

**Testing**: Nenhum framework de testes automatizado configurado no projeto (ver
plans anteriores). Validação manual pelos cenários de `quickstart.md`, mais
`npx expo lint` e `npx tsc --noEmit` (Princípio II).

**Target Platform**: iOS e Android via Expo Go; Web como plataforma secundária.

**Project Type**: App mobile único (Expo Router, managed workflow); nenhuma rota
nova é criada — a única adição de UI é um botão de excluir na aba "Prontuário" (para
a nota individual, História 7); a exclusão de paciente reaproveita o botão "Excluir"
já existente na ficha do paciente (spec 004), só muda seu comportamento interno.

**Performance Goals**: Sem metas novas; mesmas da spec 004 (ações de escrita
individuais, sem paginação ou volume alto).

**Constraints**: Nenhuma ação de exclusão desta funcionalidade DEVE emitir um
`DELETE` real contra `pacientes`, `sessoes`, `lancamentos` ou `notas` — FR-018. Toda
query inicial que carrega essas 4 tabelas DEVE filtrar `excluido`/`excluida = false`
no próprio Supabase (não no cliente, tela por tela) — é o único ponto de verdade que
garante FR-019 sem duplicar a regra em cada seletor/tela. Excluir uma sessão DEVE
marcar como excluídos o lançamento e a nota vinculados (FR-006/FR-007); excluir um
paciente DEVE marcar como excluídos, em cascata completa, todas as suas sessões,
lançamentos e notas (FR-015/FR-016) — nenhuma dessas cascatas é parcial. A edição de
uma sessão (FR-004) DEVE procurar apenas por uma nota **ativa** (não excluída)
vinculada antes de decidir entre `update`/`insert`; uma nota já excluída nunca é
reativada. A exclusão em lote continua processando um item por vez (nunca um único
`UPDATE ... WHERE id IN (...)`), agora só para isolar uma eventual falha de conexão
no meio do lote (FR-014), já que nenhum item fica bloqueado.

**Scale/Scope**: 1 migração de schema
(`contracts/migracao-exclusao-logica.sql`, substitui por completo a migração nunca
aplicada da Parte 3) + 3 arquivos de código alterados: `src/data/types.ts` (campo
`excluido`/`excluida` em `Paciente`, `Sessao`, `Lancamento`; renomear `arquivada` →
`excluida` em `Nota`), `src/store/AppStore.tsx` (filtrar `excluido`/`excluida =
false` nas queries iniciais; reescrever `excluirSessao`/`excluirPaciente`/
`removerLancamento` como `UPDATE`s em cascata em vez de `DELETE`s; adicionar
`excluirNota`; ajustar a busca de nota existente em `registrarSessao` para ignorar
notas excluídas), `src/app/paciente/[id]/index.tsx` (renomear o filtro
`!n.arquivada` → `!n.excluida`; adicionar botão de excluir por nota na aba
Prontuário, História 7). `src/app/sessao/registrar.tsx`, `agenda.tsx` e
`financeiro.tsx` continuam funcionando sem mudança de interface (só o comportamento
interno das funções do `AppStore` muda).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Fluxo Gerenciado do Expo & Mobile-First | PASS — nenhuma pasta nativa tocada; nenhuma rota nova; mudança contida em arquivos já existentes dentro de `src/app/` e `src/store/` |
| II. Segurança de Tipos & Portões de Qualidade | PASS — `npx expo lint` e `npx tsc --noEmit` continuam como gate de conclusão |
| III. Privacidade dos Dados de Pacientes (LGPD) | **PASS, com margem maior que antes** — esta revisão generaliza a retenção já exigida para a nota (Revisão 2) para as 4 entidades da funcionalidade: paciente, sessão, lançamento e nota nunca mais são apagados fisicamente por nenhuma ação desta spec. É a opção mais protetora possível dentro do que foi pedido, sem exigir nova decisão de clarificação (a usuária já pediu explicitamente "exclusão soft" para todas) |
| IV. Disciplina de Dependências & SDK | PASS — nenhuma dependência nova |
| V. Simplicidade & Sem Abstração Especulativa | PASS — um único mecanismo (coluna booleana + filtro na query inicial) substitui dois mecanismos diferentes que a Parte 3 teria introduzido (FK `CASCADE`/`SET NULL` para lançamento, coluna `arquivada` só para nota); a cascata é uma sequência simples de `UPDATE`s no cliente, reaproveitando o mesmo padrão de loop já usado na exclusão em lote (Decisão 5 do research.md) |

Nenhuma violação identificada; Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/005-editar-excluir-registro/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── contracts/
    └── migracao-exclusao-logica.sql  # Phase 1 output — DDL desta revisão (4 colunas
                                        # booleanas); substitui migracao-cascata.sql
                                        # da Parte 3 (removido, nunca aplicado)
```

### Source Code (repository root)

Projeto único (Expo Router, managed workflow) — mesma estrutura das specs
anteriores; nenhuma pasta nova.

```text
src/
├── app/
│   ├── sessao/
│   │   └── registrar.tsx     # Sem mudança de interface — continua chamando
│   │                           # excluirSessao/removerLancamento (comportamento
│   │                           # interno muda, ver AppStore.tsx)
│   ├── paciente/[id]/
│   │   └── index.tsx          # Renomear filtro !n.arquivada → !n.excluida;
│   │                           # adicionar botão "Excluir" por nota na aba
│   │                           # Prontuário (História 7, novo)
│   └── (tabs)/
│       ├── agenda.tsx         # Sem mudança de interface
│       └── financeiro.tsx     # Sem mudança de interface
├── data/
│   └── types.ts                # excluido/excluida em Paciente, Sessao, Lancamento;
│                                 # renomear Nota.arquivada → Nota.excluida
└── store/
    └── AppStore.tsx           # Queries iniciais passam a filtrar
                                 # excluido/excluida = false; excluirSessao,
                                 # excluirPaciente e removerLancamento passam a
                                 # fazer UPDATE (nunca DELETE); excluirPaciente
                                 # ganha cascata completa (sessões → lançamentos +
                                 # notas); nova função excluirNota (História 7);
                                 # busca de nota existente em registrarSessao
                                 # ignora notas excluídas (FR-004)
```

**Structure Decision**: Mantém a estrutura de projeto único já existente. Nenhuma
rota nova é criada nesta revisão — é uma migração de schema aditiva (4 colunas) nas
tabelas já existentes (spec 004) e uma generalização do mecanismo já usado para a
nota desde a Revisão 2, agora aplicado de forma consistente a paciente, sessão e
lançamento também.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Não aplicável — nenhuma violação da constituição foi identificada (ver Constitution
Check acima).
