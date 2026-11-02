# Implementation Plan: Saudação de boas-vindas por horário

**Branch**: `007-saudacao-por-horario` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-saudacao-por-horario/spec.md`

## Summary

A tela inicial exibe "Bom dia" fixo (`src/app/(tabs)/inicio.tsx`). A saudação passará a
ser derivada do horário local do dispositivo (Bom dia 05:00–11:59, Boa tarde 12:00–17:59,
Boa noite 18:00–04:59). Abordagem: um hook `useSaudacao` que calcula o texto a partir de
`new Date()`, reavalia a cada 10 minutos (mesmo mecanismo de `useProximaSessao`, com intervalo maior) e também ao app
voltar para o primeiro plano (`AppState`), sem novas dependências.

## Technical Context

**Language/Version**: TypeScript (modo estrito), React 19.3, React Native 0.88

**Primary Dependencies**: Expo SDK 58 (`expo ~58.0.21`), Expo Router; `AppState` do próprio React Native. Nenhuma dependência nova.

**Storage**: N/A

**Testing**: Não há suíte automatizada no repositório; verificação via lint, typecheck e validação manual (ver [quickstart.md](quickstart.md))

**Target Platform**: iOS e Android (Expo Go / development build)

**Project Type**: mobile-app

**Performance Goals**: Recalcular uma string a cada 10 minutos, custo desprezível

**Constraints**: Funciona offline; usa apenas o relógio local do dispositivo

**Scale/Scope**: 1 tela alterada, 1 hook novo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|-----------|-----------|
| I. Expo gerenciado & mobile-first | OK — sem mudança nativa; hook fora de `src/app/`; funciona offline |
| II. Tipos & portões de qualidade | OK — sem `any`; `npx expo lint` e `npx tsc --noEmit` obrigatórios ao final |
| III. Privacidade (LGPD) | OK — só usa o primeiro nome já exibido; nada logado ou enviado |
| IV. Dependências & SDK | OK — `AppState` é API estável do RN; sem pacotes novos |
| V. Simplicidade | OK — um hook pequeno reaproveitando o padrão existente; sem configuração nem abstração extra |

Re-check pós-design: sem violações. Complexity Tracking não necessário.

## Project Structure

### Documentation (this feature)

```text
specs/007-saudacao-por-horario/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md             # /speckit-tasks (não criado aqui)
```

(Sem `contracts/`: a feature não expõe interfaces externas.)

### Source Code (repository root)

```text
src/
├── hooks/
│   └── useSaudacao.ts   # NOVO: retorna "Bom dia" | "Boa tarde" | "Boa noite"
└── app/(tabs)/
    └── inicio.tsx       # ALTERADO: <Display>{saudacao}, {primeiroNomeUsuario}</Display>
```

**Structure Decision**: Estrutura existente de `src/` mantida; o hook segue o local e o estilo de `src/hooks/useProximaSessao.ts`.

## Complexity Tracking

Sem violações a justificar.
