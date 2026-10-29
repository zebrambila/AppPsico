# Implementation Plan: Tela de Início (Painel do Dia)

**Branch**: `003-tela-inicio` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-tela-inicio/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Evoluir a tela de Início (`src/app/(tabs)/inicio.tsx`), já existente e funcional sobre
dados mock, para atender aos requisitos formalizados na spec: bloquear o conteúdo com
uma mensagem de erro quando não houver conexão com a internet (FR-014), mascarar por
padrão os valores financeiros exibidos — com controle manual de revelar/ocultar que
reseta a cada nova abertura da tela (FR-003, FR-004, FR-016) — e manter o destaque de
"próxima sessão" atualizado automaticamente enquanto a tela estiver aberta, sem exigir
recarregar (FR-015). Abordagem: aditiva sobre a tela e componentes de UI existentes,
usando o módulo oficial `expo-network` para detecção de conectividade, estado local de
componente (resetado via `useFocusEffect`) para a máscara de valores, e um relógio
interno (intervalo) para reavaliar a próxima sessão — sem introduzir backend, persistência
nova ou abstrações compartilhadas além do estritamente necessário.

## Technical Context

**Language/Version**: TypeScript (modo estrito) sobre React Native 0.88 / React 19.3

**Primary Dependencies**: Expo SDK 58 (managed workflow), Expo Router (navegação por
abas já configurada em `src/app/(tabs)/_layout.tsx`), kit de UI interno
(`src/components/ui.tsx`), `AppStore`/`AuthStore` (contexto React existente) e o novo
módulo `expo-network` (detecção de conectividade, incluído no Expo Go)

**Storage**: N/A — esta funcionalidade não introduz persistência nova; os dados de
sessões/pacientes/financeiro continuam vindo do `AppStore` em memória (mock), e o
estado de "valor revelado" é intencionalmente transitório (não persistido, por FR-016)

**Testing**: Nenhum framework de testes automatizados está configurado no projeto
atualmente (sem Jest/Testing Library). Verificação segue o portão da Constituição
(Princípio II): `npx expo lint` e `npx tsc --noEmit` devem passar sem erros, e o
comportamento deve ser exercitado manualmente no app (Expo Go/simulador), incluindo o
cenário offline e a troca automática de próxima sessão — ver `quickstart.md`

**Target Platform**: iOS e Android via Expo Go / development build; compatibilidade
web do Expo Router mantida onde já existente (sem foco específico de testes web nesta
funcionalidade)

**Project Type**: mobile-app (Expo managed workflow, Expo Router)

**Performance Goals**: Resumo do dia perceptível em até 3s após abrir o app (SC-001);
sem chamadas de rede bloqueantes para o conteúdo em si (dados locais), exceto a
verificação de conectividade

**Constraints**: Deve continuar funcionando no Expo Go (nenhum módulo com código
nativo fora do conjunto empacotado é introduzido); deve respeitar o layout de abas
existente sem alterar a navegação entre Início/Agenda/Pacientes/Financeiro; valores
financeiros nunca podem ser exibidos sem máscara no primeiro render de uma nova
visita à tela (FR-016)

**Scale/Scope**: Uma única tela (`src/app/(tabs)/inicio.tsx`) e, no máximo, um pequeno
componente de UI reutilizável para o valor mascarado; sem novas rotas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Fluxo Gerenciado do Expo & Mobile-First | PASS — nenhuma pasta nativa é tocada; a mudança fica dentro de `src/app/(tabs)/inicio.tsx` (rota já existente) e componentes fora de `src/app/`; `expo-network` é um módulo incluído no Expo Go, não exige development build |
| II. Segurança de Tipos & Portões de Qualidade | PASS — código novo em TypeScript estrito, sem `any`; `npx expo lint` e `npx tsc --noEmit` DEVEM passar antes de concluir |
| III. Privacidade dos Dados de Pacientes (LGPD) | PASS — atende diretamente às clarificações de privacidade: valores financeiros mascarados por padrão, revelação manual, reset a cada abertura; nenhum dado de paciente é logado ou enviado a terceiros |
| IV. Disciplina de Dependências & SDK | PASS — `expo-network` confirmado via documentação versionada (`docs.expo.dev/versions/v58.0.0/sdk/network`) como incluído no Expo Go; instalação via `npx expo install expo-network` |
| V. Simplicidade & Sem Abstração Especulativa | PASS — reutiliza componentes de UI existentes (`EmptyState`, `Card`, etc.); o único componente novo (valor mascarado) se justifica por ter 2 usos reais na mesma tela, não especulativos; nenhuma camada de estado global nova |

Nenhuma violação identificada; tabela de Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/003-tela-inicio/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

Não há diretório `contracts/` nesta funcionalidade — ver justificativa na seção de
Design & Contracts abaixo.

### Source Code (repository root)

```text
src/
├── app/
│   └── (tabs)/
│       └── inicio.tsx          # Tela alvo desta funcionalidade (rota existente)
├── components/
│   ├── ui.tsx                  # Kit de UI existente (Card, Button, EmptyState, ...)
│   └── ValorMascarado.tsx      # Novo: valor financeiro com máscara/revelação (FR-003, FR-004, FR-016)
├── hooks/
│   └── useProximaSessao.ts     # Novo (opcional): deriva a sessão em destaque reavaliando
│                                 periodicamente o horário atual (FR-015)
├── store/
│   ├── AppStore.tsx             # Fonte de sessões/pacientes/lançamentos (sem mudança de contrato)
│   └── AuthStore.tsx            # Fonte da usuária autenticada (sem mudança)
└── lib/
    └── format.ts                 # Formatação de data/moeda já existente, reutilizada
```

**Structure Decision**: Projeto único (mobile-app Expo/React Native, sem
frontend/backend separados). A funcionalidade é tratada como uma extensão aditiva da
rota já existente `src/app/(tabs)/inicio.tsx`, com no máximo um componente de UI novo
(`ValorMascarado`, reutilizado nos dois pontos onde um valor monetário aparece) e,
opcionalmente, um hook pequeno para isolar a lógica de "próxima sessão com relógio" sem
inflar o componente de tela. Nenhuma pasta nova de alto nível é criada; tudo permanece
dentro de `src/` fora de `src/app/`, conforme o Princípio I da constituição.
