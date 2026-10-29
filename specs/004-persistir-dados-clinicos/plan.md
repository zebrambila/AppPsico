# Implementation Plan: Persistência Real de Pacientes, Sessões e Financeiro

**Branch**: `004-persistir-dados-clinicos` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-persistir-dados-clinicos/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Substituir a fonte de dados de pacientes, sessões, lançamentos financeiros e notas de
atendimento — hoje gerada em memória por `src/data/mock.ts` e exposta por
`src/store/AppStore.tsx` — por 4 tabelas reais no Postgres do Supabase já usado para
autenticação (spec 002), uma por entidade, isoladas por conta via Row Level Security
(`psicologa_id = auth.uid()`). O `AppStore` passa a buscar e gravar nessas tabelas por
`@supabase/supabase-js` (já instalado), mantendo o mesmo contrato de hook (`useApp()`)
que as telas já consomem sempre que possível, para minimizar mudanças nas telas
existentes. A exclusão de paciente com histórico (FR-009) é garantida pelo próprio
banco via chaves estrangeiras `ON DELETE RESTRICT` de sessões/lançamentos/notas para
pacientes, não por lógica duplicada no cliente. Como hoje não existe nenhuma tela de
cadastro/edição de paciente (o botão "+ Novo" é um placeholder que só mostra um toast),
esta funcionalidade também inclui as telas novas necessárias para isso: cadastrar,
editar e solicitar exclusão de um paciente, e uma ação de "marcar como pago" na tela
financeira (hoje só existe "Cobrar", que sinaliza lembrete, não paga).

## Technical Context

**Language/Version**: TypeScript (modo estrito) sobre React Native 0.88 / React 19.3 / Expo SDK 58

**Primary Dependencies**: `@supabase/supabase-js` (já instalado na spec 002, agora
também para consultas/gravações em Postgres, não só Auth); kit de UI e `FormField`
já existentes (`src/components/ui.tsx`, `src/components/FormField.tsx`, reaproveitados
das telas de cadastro de conta); `useConectividade` (`src/hooks/useConectividade.ts`,
criado na spec 003) reaproveitado para a mensagem de erro de escrita offline (FR-010).
Nenhuma dependência nova é introduzida.

**Storage**: Supabase Postgres (hospedado) — 4 tabelas novas: `pacientes`, `sessoes`,
`lancamentos`, `notas`, cada uma com `psicologa_id uuid references auth.users` e Row
Level Security restringindo toda operação a `psicologa_id = auth.uid()` (FR-003,
Princípio III). Schema aplicado manualmente via SQL Editor do Supabase (ver
`research.md`, Decisão 1 — mesmo padrão não-CLI já usado na spec 002), documentado em
`contracts/schema.sql`.

**Testing**: Nenhum framework de testes automatizados configurado no projeto (ver
`plan.md` da spec 003). Validação manual pelos cenários de `quickstart.md`, mais os
portões obrigatórios `npx expo lint` e `npx tsc --noEmit` (Princípio II).

**Target Platform**: iOS e Android via Expo Go (nenhuma dependência nativa nova);
Web como plataforma secundária já configurada.

**Project Type**: App mobile único (Expo Router, managed workflow) — sem backend
próprio no repositório; o "backend" é o projeto Supabase hospedado (Postgres + Auth),
apenas configurado por SQL, não desenvolvido aqui.

**Performance Goals**: Sem metas de desempenho específicas além das já definidas nas
specs anteriores (ex.: SC-001 da spec 003, resumo do dia perceptível em até 3s);
volume esperado por conta é de uma profissional individual com dezenas a poucas
centenas de pacientes/sessões, sem exigência de paginação nesta funcionalidade.

**Constraints**: Deve continuar funcionando no Expo Go (Princípio I); todas as 4
tabelas novas DEVEM ter RLS habilitado antes de qualquer dado real ser gravado
(Princípio III); a exclusão de paciente com histórico DEVE ser impossível mesmo que a
UI tente (FR-009) — garantida no nível do banco, não só na tela; qualquer ação de
gravação sem conexão DEVE falhar com mensagem clara, sem dado parcial (FR-010).

**Scale/Scope**: 4 tabelas novas + reescrita interna do `AppStore` (mesma interface
pública onde possível) + 2 telas novas (cadastro e edição de paciente, com ação de
solicitar exclusão) + 1 ação nova na tela financeira (marcar lançamento como pago) +
ajuste das telas existentes (Pacientes, ficha do paciente, Agenda, Financeiro, Início)
para os novos estados de carregamento/erro de dados vindos de rede.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Fluxo Gerenciado do Expo & Mobile-First | PASS — nenhuma pasta nativa tocada; nenhuma dependência nova com código nativo; novas telas seguem a convenção de rotas em `src/app/` já estabelecida |
| II. Segurança de Tipos & Portões de Qualidade | PASS — `npx expo lint` e `npx tsc --noEmit` continuam como gate de conclusão |
| III. Privacidade dos Dados de Pacientes (LGPD) | **PASS, e é o objetivo central desta feature** — substitui o placeholder em memória explicitamente apontado na constituição por tabelas reais com RLS por conta; prontuário (notas) e financeiro seguem a mesma regra de isolamento; exclusão de paciente com histórico é bloqueada pelo próprio banco (FR-009) |
| IV. Disciplina de Dependências & SDK | PASS — nenhuma dependência nova instalada; `@supabase/supabase-js` já foi instalado via `npx expo install` na spec 002 |
| V. Simplicidade & Sem Abstração Especulativa | PASS — reaproveita o contrato do `useApp()` e os componentes de formulário já existentes (`FormField`) em vez de criar uma camada de formulário genérica nova; usa FK `ON DELETE RESTRICT` do Postgres em vez de lógica de verificação duplicada no cliente; schema aplicado por SQL simples, sem introduzir Supabase CLI/migrations só para esta feature |

Nenhuma violação identificada; Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/004-persistir-dados-clinicos/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   ├── schema.sql        # DDL completo das 4 tabelas + RLS (aplicado manualmente no Supabase)
│   └── app-store.md      # Contrato do useApp() atualizado (mesmo padrão de contracts/auth-store.md da spec 002)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Projeto único (Expo Router, managed workflow) — sem backend próprio no repositório; o
"backend" é o projeto Supabase hospedado, configurado por SQL (ver `contracts/schema.sql`).

```text
src/
├── app/
│   ├── (tabs)/
│   │   ├── pacientes.tsx          # existente — botão "+ Novo" passa a navegar para paciente/novo
│   │   └── financeiro.tsx         # existente — nova ação "Marcar como pago" além de "Cobrar"
│   └── paciente/
│       ├── novo.tsx                # novo — formulário de cadastro de paciente (FR-001)
│       ├── [id].tsx                # existente — passa a ter "Editar" e "Excluir" (FR-002, FR-009)
│       └── [id]/
│           └── editar.tsx          # novo — formulário de edição, reaproveita o mesmo form de novo.tsx
├── components/
│   └── PacienteForm.tsx            # novo — formulário compartilhado por novo.tsx e editar.tsx
├── lib/
│   └── supabase.ts                 # existente — cliente já configurado (spec 002), reaproveitado
└── store/
    └── AppStore.tsx                # reescrito — implementa contracts/app-store.md sobre as
                                     #   tabelas do Supabase em vez de src/data/mock.ts

src/data/
└── mock.ts                         # mantido apenas como referência histórica/seed de desenvolvimento;
                                     # deixa de ser importado por AppStore.tsx em produção
```

**Structure Decision**: Mantém a estrutura de projeto único já existente (Expo Router
em `src/app/`, componentes em `src/components/`, estado em `src/store/`). Nenhuma das
opções alternativas do template (web app com frontend/backend separados, ou mobile +
API própria) se aplica — o backend é o Supabase hospedado, configurado por um script
SQL documentado, não uma API desenvolvida neste repositório.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Não aplicável — nenhuma violação da constituição foi identificada (ver Constitution
Check acima).
