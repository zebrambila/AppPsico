---

description: "Task list template for feature implementation"
---

# Tasks: Login, Criar Conta e Recuperação de Senha com Contas Persistentes

**Input**: Design documents from `/specs/002-auth-supabase/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-store.md, quickstart.md

**Tests**: Não solicitados na especificação; o projeto não tem test runner configurado
(ver research.md, Decisão 4). A verificação de cada história usa os cenários manuais
de `quickstart.md`, mais os portões `npx expo lint` / `npx tsc --noEmit` (Fase final).

**Organization**: Tarefas agrupadas por história de usuário (spec.md), para permitir
implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: História de usuário à qual a tarefa pertence (US1, US2, US3, US4)
- Caminhos de arquivo exatos incluídos em cada descrição

## Path Conventions

Projeto único (Expo Router): `src/app/`, `src/lib/`, `src/store/` na raiz do
repositório (ver plan.md — Project Structure). Não há diretório `tests/` nesta feature.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalar dependências e preparar configuração externa do Supabase

- [X] T001 Instalar as dependências novas via
  `npx expo install @supabase/supabase-js expo-secure-store react-native-url-polyfill @react-native-async-storage/async-storage`
  (atualiza `package.json`/`package-lock.json` na raiz do repositório)
- [X] T002 [P] Criar `.env.example` na raiz do repositório com `EXPO_PUBLIC_SUPABASE_URL`
  e `EXPO_PUBLIC_SUPABASE_ANON_KEY` como placeholders (ver quickstart.md — Pré-requisitos)
- [X] T003 [P] Configurado pela stakeholder diretamente no painel do Supabase (fora do
  repositório, ação manual confirmada em 2026-10-25):
  desativar confirmação de e-mail em Authentication → Providers → Email (FR-013) e
  adicionar `psico://redefinir-senha` em Authentication → URL Configuration → Redirect
  URLs (research.md — Decisão 3; quickstart.md — Pré-requisitos)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura de autenticação que todas as histórias dependem

**⚠️ CRITICAL**: Nenhuma história de usuário pode começar antes desta fase estar completa

- [X] T004 Criar o storage adapter seguro multiplataforma em `src/lib/secureStorage.ts`:
  usa `expo-secure-store` (`getItemAsync`/`setItemAsync`/`deleteItemAsync`) em iOS/Android
  e cai para `@react-native-async-storage/async-storage` apenas na plataforma web, com
  `try/catch` em cada operação (research.md — Decisão 1)
- [X] T005 Criar o cliente do Supabase em `src/lib/supabase.ts`: importa
  `react-native-url-polyfill/auto` antes de tudo, instancia `createClient` com a URL e a
  `anon key` lidas de `process.env.EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`,
  e configura `auth.storage` com o adapter de `src/lib/secureStorage.ts` (depende de T004)
- [X] T006 [P] Atualizar a interface `Usuario` em `src/store/AuthStore.tsx` para refletir
  os campos lidos do Supabase por `data-model.md` — Conta de usuária: `id` (de
  `auth.users.id`), `email` (de `auth.users.email`), `nome`, `crp?`, `celular?` (os três
  últimos de `user_metadata`) — mantendo `CadastroInput` como está
- [X] T007 Substituir o estado em memória de `src/store/AuthStore.tsx` por: leitura da
  sessão persistida na abertura do app via `supabase.auth.getSession()`, inscrição em
  `supabase.auth.onAuthStateChange` para manter `usuario` sincronizado, e um novo estado
  `carregando: boolean` que é `true` até a sessão inicial ser restaurada (contrato em
  `contracts/auth-store.md` — Estado exposto; depende de T005, T006)
- [X] T008 Implementar `sair()` em `src/store/AuthStore.tsx` chamando
  `supabase.auth.signOut()` (o adapter de T004 remove o token persistido
  automaticamente); manter a assinatura atual usada pela tela Início (depende de T007)
- [X] T009 Atualizar `src/app/_layout.tsx` para que o `Stack.Protected` leia `usuario` e
  `carregando` de `useAuth()` em vez do estado em memória anterior, evitando mostrar
  login/tabs antes da sessão persistida terminar de ser restaurada (FR-011; depende de
  T007)

**Checkpoint**: Fundação pronta — as histórias de usuário abaixo podem começar

---

## Phase 3: User Story 1 - Entrar com conta cadastrada (Priority: P1) 🎯 MVP

**Goal**: Login real contra o Supabase, substituindo a simulação que aceitava qualquer
e-mail

**Independent Test**: Com uma conta criada diretamente no painel do Supabase (sem
depender da User Story 2), entrar com e-mail/senha corretos concede acesso; e-mail
inexistente ou senha errada são negados com a mesma mensagem genérica

### Implementation for User Story 1

- [X] T010 [US1] Implementar `entrar(email, senha)` em `src/store/AuthStore.tsx`
  chamando `supabase.auth.signInWithPassword`; mapear qualquer erro de credenciais
  (e-mail inexistente ou senha incorreta) para a mesma mensagem genérica, sem indicar
  qual dos dois falhou (FR-004, SC-006; depende de T008)
- [X] T011 [US1] Atualizar `src/app/(auth)/login.tsx` para chamar o `entrar()` real de
  `useAuth()` no lugar da simulação, preservando a validação de campos e o estado de
  carregamento ("Entrando…") já existentes (depende de T010)
- [X] T012 [US1] Validado manualmente pela stakeholder junto com T015 (ver nota em
  T015): sessão persiste após reabrir o app; mensagem de erro idêntica para e-mail
  inexistente e senha incorreta

**Checkpoint**: User Story 1 funcional e testável de forma independente

---

## Phase 4: User Story 2 - Criar conta (Priority: P1)

**Goal**: Cadastro real e persistente no Supabase, ativo imediatamente, sem permitir
e-mail duplicado

**Independent Test**: Cadastrar com um e-mail novo concede acesso imediato à área
principal; repetir o cadastro com o mesmo e-mail é rejeitado

### Implementation for User Story 2

- [X] T013 [US2] Implementar `cadastrar(dados)` em `src/store/AuthStore.tsx` chamando
  `supabase.auth.signUp` com `options.data = { nome, crp, celular }` (FR-001); mapear o
  erro de e-mail já cadastrado retornado pelo Supabase para a mensagem "e-mail já está
  em uso" (FR-002; depende de T008)
- [X] T014 [US2] Atualizar `src/app/(auth)/cadastro.tsx` para chamar o `cadastrar()`
  real de `useAuth()` no lugar da simulação, preservando toda a validação de campos
  (nome, e-mail, senha ≥ 8 caracteres, confirmação, termos) e o estado de carregamento
  ("Criando conta…") já existentes (depende de T013) — já chamava `cadastrar()` via
  `useAuth()` genericamente; nenhuma mudança de código foi necessária neste arquivo
- [X] T015 [US2] Validado manualmente pela stakeholder em 2026-10-25: conta criada
  ficou ativa imediatamente (sem confirmação de e-mail); segundo cadastro com o mesmo
  e-mail foi rejeitado; sair e entrar novamente funcionou; e-mail inexistente e senha
  incorreta geraram a mesma mensagem de erro genérica (cobre também T012)

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente

---

## Phase 5: User Story 3 - Recuperar senha esquecida (Priority: P2)

**Goal**: Fluxo completo de recuperação de senha, concluído dentro do próprio app via
deep link

**Independent Test**: Solicitar recuperação para uma conta existente, abrir o link
recebido por e-mail, definir uma nova senha dentro do app, e confirmar que só a nova
senha funciona a partir daí

### Implementation for User Story 3

- [X] T016 [P] [US3] Criar a rota `src/app/(auth)/esqueci-senha.tsx` (reaproveitando
  `AuthScreen`, `FormField`, `Button` como em `login.tsx`): campo de e-mail com a mesma
  validação de formato usada em `login.tsx` ("Informe um e-mail válido." bloqueando o
  envio — FR-005) e um link de volta para `/login`
- [X] T017 [US3] Implementar `solicitarRecuperacaoSenha(email)` em
  `src/store/AuthStore.tsx` chamando
  `supabase.auth.resetPasswordForEmail(email, { redirectTo: "psico://redefinir-senha" })`;
  a função MUST resolver com sucesso tanto para e-mails com conta quanto sem conta, sem
  diferenciar a resposta (FR-006, SC-006; depende de T008)
- [X] T018 [US3] Conectar `src/app/(auth)/esqueci-senha.tsx` ao
  `solicitarRecuperacaoSenha()` de `useAuth()`, exibindo a mesma mensagem de
  confirmação de envio independentemente do resultado (depende de T016, T017)
- [X] T019 [US3] **Caminho corrigido durante a implementação**: criada em
  `src/app/redefinir-senha.tsx` (raiz, fora do grupo `(auth)`), não
  `src/app/(auth)/redefinir-senha.tsx` como originalmente planejado — `verifyOtp`
  autentica temporariamente a usuária, e o grupo `(auth)` é escondido pelo
  `Stack.Protected` assim que há sessão; uma rota fora de qualquer `Stack.Protected`
  (como `index`) era necessária para a tela não desaparecer sozinha. Lê os parâmetros
  `token_hash` e `type=recovery` via `useLocalSearchParams`, chama
  `supabase.auth.verifyOtp({ token_hash, type: 'recovery' })` para estabelecer a sessão
  temporária de recuperação, e renderiza um formulário com "Nova senha" e "Confirmar
  nova senha" (reaproveitando `FormField` e o indicador de força de senha, extraído de
  `cadastro.tsx` para `src/lib/forcaSenha.ts`), bloqueando o envio se os dois campos
  não coincidirem ou a senha tiver menos de 8 caracteres. `src/app/_layout.tsx` também
  precisou declarar essa rota fora de qualquer `Stack.Protected`
- [X] T020 [US3] Implementar `redefinirSenha(novaSenha)` em `src/store/AuthStore.tsx`
  chamando `supabase.auth.updateUser({ password: novaSenha })` sobre a sessão de
  recuperação; em caso de erro (token já usado ou expirado), rejeitar com uma mensagem
  que oriente a usuária a solicitar uma nova recuperação (FR-007, FR-008; depende de
  T008)
- [X] T021 [US3] Conectar `src/app/redefinir-senha.tsx` ao `redefinirSenha()` de
  `useAuth()`, navegando para a área principal (ou para o login) após o sucesso, e
  exibindo a mensagem de link expirado/já usado em caso de falha (depende de T019,
  T020)
- [X] T022 [US3] Em `src/app/(auth)/login.tsx`, substituir o botão "Esqueci minha
  senha" (que hoje só mostra um toast fixo) por uma navegação para a rota
  `/esqueci-senha` criada em T016 (depende de T016)
- [X] T023 [US3] Validado manualmente pela stakeholder em 2026-10-25, via web (após
  corrigir o template de e-mail do Supabase para usar `{{ .TokenHash }}` — ver
  research.md): confirmação de envio idêntica, link abre a tela de nova senha dentro
  do app, redefinição funciona

**Checkpoint**: Todas as histórias de usuário até aqui (US1, US2, US3) funcionam de
forma independente

---

## Phase 6: User Story 4 - Validação de campos e tratamento de erros (Priority: P3)

**Goal**: Mensagens de erro específicas por campo antes do envio, e uma mensagem
distinta para falha de comunicação (em vez de confundir com credenciais inválidas), nas
três telas

**Independent Test**: Preencher cada formulário com dados inválidos bloqueia o envio
com a mensagem certa por campo; desligar a rede durante uma tentativa mostra uma
mensagem de erro de comunicação (não de credenciais) e preserva os campos digitados

### Implementation for User Story 4

- [X] T024 [US4] Já satisfeita pela implementação das fases anteriores: `entrar`,
  `cadastrar`, `solicitarRecuperacaoSenha` e `redefinirSenha` em
  `src/store/AuthStore.tsx` já usam o mesmo critério consistente
  (`isAuthError(error) && error.status === undefined`) para mapear falha de
  rede/conectividade para uma mensagem distinta da de credenciais/validação — nenhuma
  tarefa adicional foi necessária
- [X] T025 [US4] Confirmado por leitura: `src/app/(auth)/login.tsx`,
  `src/app/(auth)/cadastro.tsx`, `src/app/(auth)/esqueci-senha.tsx` e
  `src/app/redefinir-senha.tsx` nunca limpam campos no `catch` (só chamam `showToast` e
  resetam o estado de carregamento no `finally`) — nenhum ajuste foi necessário
- [ ] T026 [US4] **Encerrada parcialmente — spec fechada em 2026-10-25 com esta tarefa
  pendente.** Cenário 5 (validação de campo por campo) validado pela stakeholder.
  Falta o Cenário 6 (falha de rede preserva os dados digitados com mensagem de erro
  distinta) — adiado para um teste futuro

**Checkpoint**: Todas as quatro histórias de usuário funcionam de forma independente

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Portões de qualidade do Princípio II da constituição e validação final

- [X] T027 [P] Rodar `npx expo lint` na raiz do repositório e corrigir qualquer
  apontamento antes de concluir
- [X] T028 Rodar `npx tsc --noEmit` na raiz do repositório e corrigir qualquer erro de
  tipo antes de concluir (depende de T001–T026 estarem implementadas)
- [X] T029 [P] Atualizar `README.md` — item "0. Autenticação real" de "Próximos passos
  sugeridos" — para registrar que a autenticação real via Supabase foi implementada
  por esta feature; também documentado o `.env` necessário na seção "Como rodar"
- [ ] T030 **Encerrada parcialmente — spec fechada em 2026-10-25 com esta tarefa
  pendente**, junto com T026 (Cenário 6). Executar o passo a passo completo de
  `quickstart.md` do início ao fim como aceite final da feature, quando T026 for
  concluída

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Fase 2)**: depende da conclusão da Fase 1 — **bloqueia** todas as
  histórias de usuário
- **User Stories (Fase 3–6)**: todas dependem da Fase 2 concluída
  - US1 e US2 (ambas P1) podem ser feitas em paralelo por pessoas diferentes, ou em
    sequência
  - US3 (P2) depende apenas da Fase 2 (não de US1/US2), mas faz mais sentido
    sequencialmente após o MVP
  - US4 (P3) depende da Fase 2 e toca os mesmos arquivos de US1/US2/US3 — fazer por
    último evita retrabalho de merge
- **Polish (Fase 7)**: depende de todas as histórias desejadas estarem completas

### Dentro de cada história

- Em `src/store/AuthStore.tsx`, as implementações de `entrar` (T010), `cadastrar`
  (T013), `solicitarRecuperacaoSenha` (T017) e `redefinirSenha` (T020) estão no mesmo
  arquivo: não são paralelizáveis entre si, mesmo pertencendo a histórias diferentes
- Dentro de cada história, a tela (ex.: T011, T014, T018, T021) depende da função do
  `AuthStore` correspondente já implementada (ex.: T010, T013, T017, T020)
- A validação manual de cada história (T012, T015, T023, T026) é sempre o último passo
  daquela história

### Parallel Opportunities

- T002 e T003 (Fase 1) podem rodar em paralelo entre si
- T006 (Fase 2) pode rodar em paralelo com T004/T005 (arquivos diferentes), mas T007
  depende de ambos
- T016 (Fase 5, criar a rota `esqueci-senha.tsx`) pode começar em paralelo com qualquer
  tarefa de US1/US2, já que é um arquivo novo e independente — só precisa da Fase 2
- T027 e T029 (Fase 7) podem rodar em paralelo entre si

---

## Parallel Example: Foundational Phase

```bash
# T004 e T006 podem ser feitos em paralelo (arquivos diferentes):
Task: "Criar o storage adapter seguro em src/lib/secureStorage.ts"
Task: "Atualizar a interface Usuario em src/store/AuthStore.tsx"

# T005 depende de T004; T007 depende de T005 e T006 — não entram no mesmo lote paralelo
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar a Fase 1: Setup
2. Completar a Fase 2: Foundational (crítico — bloqueia todas as histórias)
3. Completar a Fase 3: User Story 1 (login real)
4. **Parar e validar**: rodar o Cenário 2 e 3 de `quickstart.md` com uma conta criada
   manualmente no painel do Supabase
5. Esse já é um MVP utilizável para quem recebe uma conta criada pelo painel

### Incremental Delivery

1. Setup + Foundational → fundação pronta
2. US1 (login) → validar → MVP demonstrável (com conta criada no painel)
3. US2 (criar conta) → validar → fluxo completo de entrada sem depender do painel
4. US3 (recuperar senha) → validar → cobre o caso de senha esquecida
5. US4 (validação/erros) → validar → experiência de erro consistente nas três telas
6. Fase 7 (Polish) → portões de qualidade + aceite final

---

## Notes

- Nenhuma tarefa de teste automatizado foi incluída (ver seção **Tests** no topo e
  research.md — Decisão 4); a verificação de cada história é manual, via
  `quickstart.md`.
- `src/store/AuthStore.tsx` é compartilhado por todas as histórias — tarefas que o
  tocam nunca são `[P]` entre si, mesmo quando pertencem a histórias diferentes.
- Fazer commit após cada tarefa ou grupo lógico de tarefas.
- Parar em qualquer checkpoint para validar a história correspondente de forma
  independente antes de seguir para a próxima.
