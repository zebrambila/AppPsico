# Implementation Plan: Scroll Automático com Teclado

**Branch**: `006-scroll-teclado` | **Date**: 2026-10-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-scroll-teclado/spec.md`

## Summary

Hoje, apenas as telas de autenticação (`AuthScreen`) tratam o teclado corretamente
(`KeyboardAvoidingView` + `ScrollView`). O wrapper de tela genérico usado por quase
todo o resto do app (`Screen`, em `src/components/ui.tsx`) tem um `ScrollView` mas
nenhum `KeyboardAvoidingView`, e `PacienteForm` agrava o problema aninhando um segundo
`ScrollView` vertical dentro do `ScrollView` de `Screen`. Resultado: nos formulários de
paciente e de sessão, campos próximos ao final da tela ficam atrás do teclado e o
usuário não consegue vê-los nem alcançar o botão de salvar com facilidade.

A abordagem técnica é replicar, nos pontos afetados, o padrão que já existe e funciona
em `AuthScreen` — `KeyboardAvoidingView` envolvendo o `ScrollView`, com
`behavior="padding"` no iOS — em vez de introduzir uma biblioteca nova. Isso cobre
`Screen` (usado por `paciente/novo.tsx`, `paciente/[id]/editar.tsx`,
`sessao/registrar.tsx` e outras telas) e o `ScrollView` próprio de `sessao/nova.tsx`.
Em paralelo, o `ScrollView` interno de `PacienteForm` é removido (viraria um
`View` simples), eliminando o aninhamento vertical de `ScrollView`s. Por fim, adiciona-se
o fechamento do teclado ao tocar fora de qualquer campo (FR-004/FR-009 da spec),
replicado de forma consistente em `Screen` e `AuthScreen`.

## Technical Context

**Language/Version**: TypeScript 6.0 (modo estrito) sobre React Native 0.88 / React 19.3

**Primary Dependencies**: Expo SDK 58 (managed), Expo Router ~58, `react-native-safe-area-context`.
Nenhuma dependência nova é necessária — a correção reutiliza as APIs nativas do React
Native já em uso no projeto (`KeyboardAvoidingView`, `Keyboard.dismiss`), seguindo o
padrão já validado em `src/components/AuthScreen.tsx`.

**Storage**: N/A — funcionalidade é puramente de comportamento de interface, não lê nem
grava dados de pacientes/sessões/financeiro.

**Testing**: Este repositório não tem um runner de testes automatizados configurado
(sem Jest/RNTL no `package.json`). Verificação é: `npx expo lint` + `npx tsc --noEmit`
(Princípio II da constituição) e exercício manual no app (simulador iOS, emulador
Android, ou Expo Go) em cada tela afetada, conforme a seção "Fluxo de Desenvolvimento &
Portões de Qualidade" da constituição.

**Target Platform**: iOS e Android via Expo Go / managed workflow — nenhuma nova
dependência nativa é introduzida, então o app continua funcionando no Expo Go.

**Project Type**: mobile-app (projeto único Expo Router)

**Performance Goals**: ajuste de scroll deve ocorrer sem atraso perceptível ao focar um
campo (alinhado ao `KeyboardAvoidingView` nativo, sem animações customizadas) — SC-003.

**Constraints**: não introduzir `ScrollView`s verticais aninhados; não regredir o
tratamento de safe-area já existente em `Screen`/`AuthScreen`; manter compatibilidade
com Expo Go (sem módulos nativos adicionais); manter TypeScript estrito sem `any`.

**Scale/Scope**: 2 componentes compartilhados (`src/components/ui.tsx` → `Screen`,
`src/components/PacienteForm.tsx`) + 1 componente já conforme a ser alinhado
(`src/components/AuthScreen.tsx`, apenas para o fechar-ao-tocar-fora) + 1 tela com
`ScrollView` próprio (`src/app/sessao/nova.tsx`). As demais telas afetadas
(`paciente/novo.tsx`, `paciente/[id]/editar.tsx`, `sessao/registrar.tsx`) herdam a
correção automaticamente por usarem `Screen`/`PacienteForm`, sem alteração própria.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Fluxo Gerenciado do Expo & Mobile-First | PASS — nenhuma pasta nativa é tocada; mudança é em componentes dentro de `src/components` e uma tela em `src/app`, sem alterar `app.json`/config plugins. Comportamento mobile-first (teclado/safe-area) é exatamente o que está sendo corrigido. |
| II. Segurança de Tipos & Portões de Qualidade | PASS (gate a confirmar na implementação) — mudanças usam APIs tipadas do React Native já usadas no projeto; `npx expo lint` e `npx tsc --noEmit` DEVEM passar antes de concluir qualquer tarefa. |
| III. Privacidade dos Dados de Pacientes (LGPD) | N/A — feature não lê, grava, loga nem transmite dados de pacientes; é comportamento de UI (scroll/teclado) sobre os mesmos campos já renderizados. |
| IV. Disciplina de Dependências & SDK | PASS — nenhuma dependência nova é adicionada; as APIs usadas (`KeyboardAvoidingView`, `Keyboard`) são núcleo do React Native e já estão em uso funcional no mesmo SDK/versão dentro deste repositório (`AuthScreen.tsx`), então o comportamento já está validado em código, não em memória de treinamento. |
| V. Simplicidade & Sem Abstração Especulativa | PASS — a solução reaproveita o padrão existente (`AuthScreen`) em vez de criar um wrapper genérico novo ou adicionar uma lib de terceiros (ex.: keyboard-aware-scroll-view); o `ScrollView` duplicado em `PacienteForm` é removido em vez de mantido por compatibilidade. |

Nenhuma violação. Seção "Complexity Tracking" não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/006-scroll-teclado/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

Sem `data-model.md`: a spec declara explicitamente "Key Entities: Não aplicável" — não
há entidade de dados nova ou alterada. Sem `contracts/`: a funcionalidade não expõe nem
consome nenhuma interface externa (API, CLI, etc.) — é comportamento de UI interno ao
app.

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx            # usa AuthScreen — já tem KeyboardAvoidingView (sem alteração de scroll)
│   │   ├── cadastro.tsx         # usa AuthScreen — idem
│   │   └── esqueci-senha.tsx    # usa AuthScreen — idem
│   ├── redefinir-senha.tsx      # usa AuthScreen — idem
│   ├── paciente/
│   │   ├── novo.tsx             # usa Screen + PacienteForm — corrigido via os dois componentes
│   │   └── [id]/editar.tsx      # usa Screen + PacienteForm — idem
│   └── sessao/
│       ├── nova.tsx             # ScrollView próprio — MODIFICAR (adicionar KeyboardAvoidingView)
│       └── registrar.tsx        # usa Screen — corrigido via Screen
└── components/
    ├── ui.tsx                   # `Screen` — MODIFICAR (adicionar KeyboardAvoidingView + fechar teclado ao tocar fora)
    ├── AuthScreen.tsx           # MODIFICAR (apenas: fechar teclado ao tocar fora, para consistência com FR-004)
    └── PacienteForm.tsx         # MODIFICAR (remover o ScrollView interno — delega o scroll ao Screen pai)
```

**Structure Decision**: Projeto mobile único (Expo Router), sem diretório `backend/` ou
`api/` — todo o código vive em `src/app` (rotas) e `src/components` (não-rotas), como já
estabelecido pelo repositório e pelo Princípio I da constituição. A correção é aplicada
na camada de componentes compartilhados sempre que possível (`Screen`, `PacienteForm`,
`AuthScreen`), para que as telas que já delegam a ele (`paciente/novo.tsx`,
`paciente/[id]/editar.tsx`, `sessao/registrar.tsx`) herdem o comportamento sem
modificação própria; apenas `sessao/nova.tsx`, que monta seu próprio `ScrollView` fora
de `Screen`, precisa de uma edição direta.

## Complexity Tracking

> Não se aplica — nenhuma violação do Constitution Check.
