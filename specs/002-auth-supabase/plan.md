# Implementation Plan: Login, Criar Conta e Recuperação de Senha com Contas Persistentes

**Branch**: `002-auth-supabase` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-auth-supabase/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Substituir a autenticação simulada em memória (`src/store/AuthStore.tsx`) por contas
reais e persistentes no Supabase Auth, cobrindo login, criação de conta e recuperação
de senha. O `useAuth()` passa a falar com `@supabase/supabase-js`, com a sessão
guardada de forma segura no dispositivo (`expo-secure-store` em iOS/Android) para que a
usuária permaneça conectada entre aberturas do app. A recuperação de senha usa o fluxo
PKCE do Supabase com o link de e-mail abrindo, via deep link (`scheme: "psico"` já
configurado), uma nova rota do Expo Router dentro do próprio app — sem passar por uma
página web externa. Nome, CRP e celular continuam sendo capturados no cadastro, agora
guardados no `user_metadata` do Supabase em vez de em memória. Nenhuma nova tabela,
tela de confirmação de e-mail, ou verificação de CRP é introduzida (decisões já
fechadas com a stakeholder no spec).

## Technical Context

**Language/Version**: TypeScript 6.0 (modo estrito) sobre React Native 0.88 / React 19.3 / Expo SDK 58

**Primary Dependencies**: `expo-router` (já em uso), `@supabase/supabase-js` (novo),
`expo-secure-store` (novo), `react-native-url-polyfill` (novo, exigido pelo
`supabase-js` em React Native), `@react-native-async-storage/async-storage` (novo,
fallback de storage apenas na plataforma web — ver research.md)

**Storage**: Supabase Auth/Postgres hospedado (contas de usuária); cache local da
sessão (access/refresh token) via `expo-secure-store` em iOS/Android

**Testing**: Nenhum test runner automatizado configurado no projeto; validação por
execução manual guiada por `quickstart.md`, mais os portões `npx expo lint` e
`npx tsc --noEmit` exigidos pelo Princípio II da constituição (ver research.md,
Decisão 4)

**Target Platform**: iOS e Android via Expo Go (sem development build — todas as
dependências novas são compatíveis com Expo Go); Web como plataforma secundária já
configurada no `app.json`, com fallback de armazenamento de sessão (ver research.md)

**Project Type**: App mobile único (Expo Router, managed workflow) — sem backend
próprio no repositório; o backend é o projeto Supabase hospedado, apenas configurado,
não desenvolvido aqui

**Performance Goals**: Sem metas de desempenho específicas além das já definidas no
spec (SC-002: login em menos de 15s; SC-003: cadastro em menos de 2min), em condições
normais de conectividade — sem alvo de throughput/concorrência, dado o volume de uso
(profissional individual por conta)

**Constraints**: Deve continuar funcionando no Expo Go (Princípio I); token de sessão
não pode ser persistido em texto puro (Princípio III/LGPD); mensagens de erro de login
e de recuperação de senha não podem revelar se um e-mail tem conta (FR-004, FR-006,
SC-006); link de recuperação de senha usado mais de uma vez ou expirado deve ser
rejeitado (FR-008)

**Scale/Scope**: 4 telas (login, criar conta, esqueci senha, definir nova senha) e um
módulo de autenticação (`AuthStore`/cliente Supabase); escopo de uma profissional por
conta, sem relação entre contas nesta feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Fluxo Gerenciado do Expo & Mobile-First | **PASS, com ressalva anotada durante a implementação** — todas as dependências novas (`@supabase/supabase-js`, `expo-secure-store`, `react-native-url-polyfill`, `@react-native-async-storage/async-storage`) são compatíveis com Expo Go; nenhuma exige `ios/`/`android/` nativos nem development build. A nova tela de redefinição de senha ficou em `src/app/redefinir-senha.tsx` (fora do grupo `(auth)` — ver research.md, Decisão 3). O link de recuperação por e-mail, porém, só abre de forma garantida no app em iOS/Android a partir de uma development/standalone build — o scheme customizado (`psico://`) não é resolvido de forma confiável no Expo Go (Expo Go usa `exp://` para si mesmo). Na web, o fluxo já funciona dentro do Expo Go/Metro, pois usa uma URL http(s) comum em vez do scheme. |
| II. Segurança de Tipos & Portões de Qualidade | **PASS** — nenhuma mudança de modo estrito do TypeScript; `npx expo lint` e `npx tsc --noEmit` continuam como gate de conclusão (ver quickstart.md). |
| III. Privacidade dos Dados de Pacientes (LGPD) | **PASS, e é o objetivo central desta feature** — substitui a autenticação simulada (explicitamente apontada como placeholder a ser trocado) por contas reais, com token de sessão guardado em armazenamento seguro em vez de texto puro (research.md, Decisão 1). Isolamento de dados entre contas permanece como premissa herdada do spec, não resolvida por esta feature isoladamente. |
| IV. Disciplina de Dependências & SDK | **PASS** — versão major do Expo (58) verificada em `package.json` antes de decidir sobre `expo-secure-store`/Expo Router (ver fontes no research.md); todas as dependências novas serão instaladas via `npx expo install`. |
| V. Simplicidade & Sem Abstração Especulativa | **PASS** — perfil guardado em `user_metadata` em vez de criar uma tabela/migração nova (research.md, Decisão 2); nenhum framework de testes introduzido só para esta feature (Decisão 4); nenhuma camada de abstração para múltiplos provedores de autenticação, já que só há um provedor decidido. |

Nenhuma violação identificada — Complexity Tracking permanece vazio.

**Re-check pós Fase 1 (design)**: mantém-se PASS em todos os princípios. Os artefatos
de design (data-model.md, contracts/auth-store.md, quickstart.md) não introduziram
nenhuma tabela nova, dependência adicional, ou abstração alem das já listadas acima.

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-supabase/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── auth-store.md    # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Projeto único (Expo Router, managed workflow) — sem backend próprio no repositório; o
"backend" é o projeto Supabase hospedado, apenas configurado (ver quickstart.md).

```text
src/
├── app/
│   ├── redefinir-senha.tsx        # novo — FORA do grupo (auth): rota aberta pelo deep link de
│   │                              #   recuperação; chama verifyOtp() e depois redefinirSenha().
│   │                              #   Precisa ficar fora de qualquer Stack.Protected porque
│   │                              #   verifyOtp autentica temporariamente a usuária, e o grupo
│   │                              #   (auth) (guardado por !logado) seria escondido nesse momento.
│   └── (auth)/
│       ├── login.tsx              # existente — passa a chamar entrar() real
│       ├── cadastro.tsx           # existente — passa a chamar cadastrar() real
│       └── esqueci-senha.tsx      # novo — solicitarRecuperacaoSenha()
├── components/                    # FormField, AuthScreen, ui — reaproveitados sem mudança de contrato
├── lib/
│   ├── supabase.ts                # novo — cliente @supabase/supabase-js + storage adapter seguro
│   ├── secureStorage.ts           # novo — adapter SecureStore (iOS/Android) / AsyncStorage (web)
│   └── forcaSenha.ts              # novo — extraído de cadastro.tsx para reuso em redefinir-senha.tsx
└── store/
    └── AuthStore.tsx              # reescrito — implementa o contrato em contracts/auth-store.md
                                    #   sobre o cliente Supabase, em vez de estado em memória

tests/                             # não aplicável nesta feature (ver research.md, Decisão 4;
                                    #   validação manual em quickstart.md)
```

**Structure Decision**: mantém a estrutura de projeto único já existente no repositório
(Expo Router em `src/app/`, componentes em `src/components/`, estado em `src/store/`).
Adiciona apenas `src/lib/supabase.ts` como novo módulo de infraestrutura e duas rotas
novas dentro do grupo `(auth)` já existente. Nenhuma das opções alternativas do template
(web app com frontend/backend separados, ou mobile + API própria) se aplica — não há
API própria sendo construída, apenas um backend hospedado sendo configurado.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Não aplicável — nenhuma violação da constituição foi identificada (ver Constitution
Check acima).
