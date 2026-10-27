# Research: Login, Criar Conta e Recuperação de Senha com Contas Persistentes

**Feature**: `002-auth-supabase` | **Date**: 2026-10-24

Fontes consultadas (versão major do Expo no projeto é 58, conforme
`package.json` — AGENTS.md exige checar a documentação da versão correspondente antes
de decidir sobre APIs do Expo):
- `https://docs.expo.dev/versions/v58.0.0/sdk/securestore/`
- `https://docs.expo.dev/router/advanced/native-intent/`
- `https://supabase.com/docs/guides/auth/quickstarts/react-native`
- `https://supabase.com/docs/guides/auth/sessions`
- `https://supabase.com/docs/guides/auth/passwords`

## Decisão 1 — Cliente e sessão: `@supabase/supabase-js` com storage adapter próprio

**Decision**: Usar `@supabase/supabase-js` como cliente do Supabase Auth, configurado
com um storage adapter próprio (`getItem`/`setItem`/`removeItem`) que usa
`expo-secure-store` em iOS/Android. `@supabase/supabase-js` é 100% JavaScript (sem
código nativo), e `expo-secure-store` é um módulo Expo padrão incluído no Expo Go —
nenhum dos dois exige development build, preservando o Princípio I (Expo Go) da
constituição do projeto.

**Rationale**: O quickstart oficial do Supabase para React Native instala
`@react-native-async-storage/async-storage` como storage adapter padrão, mas o
AsyncStorage grava em texto plano no armazenamento do app. O Princípio III da
constituição (privacidade de dados de pacientes/LGPD) e o próprio README do projeto já
apontam `expo-secure-store` como o mecanismo correto para guardar token de sessão. Como
a sessão do Supabase (access + refresh token) é o que concede acesso a toda a área
autenticada — incluindo prontuário e financeiro — ela deve receber o mesmo tratamento
de confidencialidade exigido para os dados que protege.

**Alternatives considered**:
- `AsyncStorage` (padrão do quickstart): rejeitado por armazenar em texto plano,
  incompatível com o Princípio III.
- Deixar a sessão apenas em memória (sem persistência): rejeitado porque viola
  diretamente FR-003 (conta deve permanecer válida entre reaberturas do app) e a
  Assumption de login persistente do spec.

**Known risk / mitigation**: versões antigas do iOS chegaram a rejeitar valores acima
de ~2048 bytes no Keychain; o payload de sessão do Supabase (JSON com dois tokens) é
pequeno, mas o storage adapter deve tratar erros de escrita (`try/catch`) e, se
necessário, persistir apenas o `refresh_token` (menor) e deixar o SDK obter um novo
`access_token` na inicialização, em vez de falhar silenciosamente.

**Web**: `expo-secure-store` não lista suporte a web na documentação da versão 58. Como
o app também roda em `web` (ver `app.json`), o storage adapter MUST escolher
`expo-secure-store` em iOS/Android e cair para um armazenamento equivalente do
navegador (ex.: `localStorage`) apenas em web — sem persistir tokens em texto plano
fora do navegador do próprio usuário. Esse comportamento condicional por plataforma é a
única ramificação de plataforma introduzida por esta feature.

## Decisão 2 — Perfil da psicóloga: `user_metadata` do Supabase Auth (sem tabela extra por ora)

**Decision**: Guardar nome, CRP e celular no `user_metadata` do próprio usuário do
Supabase Auth (enviado como `options.data` no `signUp`), em vez de criar uma tabela
`profiles` separada no Postgres do Supabase nesta feature.

**Rationale**: O escopo desta especificação é login, criar conta e recuperação de
senha — não listar, buscar ou relacionar psicólogas entre si. `user_metadata` resolve
isso sem exigir uma tabela nova, política de RLS, nem migração — alinhado ao Princípio
V (simplicidade, sem abstração especulativa) da constituição. `iniciaisDe(nome)` e as
telas que hoje leem `usuario.nome`/`usuario.crp`/`usuario.celular` continuam
funcionando sem mudança de forma.

**Alternatives considered**: Tabela `profiles` própria com chave estrangeira para
`auth.users.id`: é o padrão mais comum em apps Supabase maiores e deveria ser adotada
no momento em que uma funcionalidade futura precisar consultar/filtrar psicólogas por
esses campos (o que esta feature não precisa) — documentado aqui para não ser
esquecido, não implementado agora.

## Decisão 3 — Redefinição de senha: fluxo PKCE com link abrindo rota do Expo Router

**Decision**: Chamar `resetPasswordForEmail(email, { redirectTo: "psico://redefinir-senha" })`
no Supabase. O app já declara `"scheme": "psico"` em `app.json`, então o link recebido
por e-mail abre diretamente a rota `src/app/(auth)/redefinir-senha.tsx` via Expo Router
— sem precisar de um arquivo `+native-intent.tsx`, já que o `redirectTo` é escolhido
para corresponder a uma rota existente do próprio app (o papel do `+native-intent` é só
reescrever links de formato diferente, que não é o caso aqui). Essa rota lê os
parâmetros do link (`token_hash`, `type=recovery`), chama `verifyOtp` para obter uma
sessão temporária de recuperação, e então chama `updateUser({ password })` quando a
usuária confirma a nova senha — implementando FR-015 (nova senha definida dentro do
próprio app).

**Rationale**: Resolve a decisão já tomada com a stakeholder (reset dentro do app, não
em página web) com o menor número de peças novas: reaproveita o `scheme` já
configurado e o próprio sistema de rotas do Expo Router, em vez de introduzir
mecanismos de link adicionais.

**Alternatives considered**:
- Deixar a Supabase redirecionar para uma página web própria e depois voltar ao app:
  rejeitado — contraria a decisão já tomada com a stakeholder.
- Universal Links (`https://`) em vez de scheme customizado: mais trabalho de
  configuração (domínio verificado, arquivo `apple-app-site-association`) sem benefício
  adicional para o escopo atual; falta de suporte a universal links continua sem hoje
  bloquear nada, já que o app já usa `scheme` customizado para outros fins (ver
  `app.json`). Pode ser revisitado se o app precisar de links abertos a partir de um
  site próprio no futuro.

**Enumeração de e-mail**: `resetPasswordForEmail` já retorna sem erro mesmo quando o
e-mail não tem conta (confirmado na documentação do Supabase), o que atende
diretamente FR-006/SC-006 (não revelar quais e-mails têm conta) sem lógica adicional
no app.

**Correção descoberta durante os testes manuais — template de e-mail precisa ser
customizado**: por padrão, o template "Reset Password" do Supabase usa
`{{ .ConfirmationURL }}`, que aponta para o endpoint hospedado do próprio Supabase
(`/auth/v1/verify`), não direto para o app. Abrir esse link faz o Supabase verificar o
token no servidor e then redirecionar para a `redirectTo` com tokens de sessão (fluxo
implícito) ou um `code` (PKCE) — nenhum dos dois é o `token_hash`/`type` que
`redefinir-senha.tsx` espera na URL, então a tela mostrava "Link inválido ou expirado"
mesmo com um link recém-enviado. A correção (confirmada em
`https://supabase.com/docs/guides/auth/auth-email-templates`) é trocar o link do
template "Reset Password" (Authentication → Email Templates, no painel do Supabase)
para usar `{{ .TokenHash }}` e `{{ .RedirectTo }}` diretamente:
`{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery` — documentado em
`quickstart.md`, Pré-requisitos. Essa é uma configuração do projeto Supabase (como o
Redirect URL e o toggle de confirmação de e-mail), não um ajuste de código.

**Correção descoberta durante a implementação — scheme customizado não é confiável no
Expo Go**: a documentação do Expo (`https://docs.expo.dev/versions/v58.0.0/sdk/linking/`)
confirma que o Expo Go usa o esquema `exp://` para si mesmo, e que um scheme
customizado (`psico://`) só é resolvido de forma garantida em uma development ou
standalone build — não no Expo Go. Isso quebra o teste do fluxo de recuperação de
senha tanto no navegador (schemes customizados nunca abrem no browser) quanto no
próprio Expo Go durante o desenvolvimento. `urlDeRedefinicaoDeSenha()` em
`src/store/AuthStore.tsx` agora escolhe a URL de redirecionamento por plataforma: na
web, usa a própria origem servida pelo Metro (`window.location.origin + '/redefinir-senha'`,
uma URL http(s) comum, testável no navegador); em iOS/Android, continua usando
`psico://redefinir-senha`. Essa segunda parte (mobile) só é testável de ponta a ponta
numa development build (`npx expo run:ios|android` ou `eas build --profile development`),
não no Expo Go — uma limitação a documentar explicitamente, não a contornar com mais
engenharia nesta feature.

## Decisão 4 — Sem framework de testes automatizados nesta feature

**Decision**: Esta feature não introduz um test runner (ex.: Jest) — o projeto
atualmente não possui nenhum configurado. A validação acontece via execução manual
guiada por `quickstart.md`, mais os portões já exigidos pelo Princípio II da
constituição (`npx expo lint` e `npx tsc --noEmit`, ambos sem erros).

**Rationale**: Introduzir um framework de testes é uma decisão maior que afeta todo o
projeto, não só esta feature de autenticação — está fora do escopo pedido e seria uma
abstração/ferramenta especulativa adicionada sem necessidade imediata (Princípio V).

**Alternatives considered**: Adicionar Jest + Testing Library apenas para esta
feature: rejeitado por desproporcional ao pedido; pode ser proposto como uma feature
própria caso o projeto decida adotar testes automatizados de forma geral.

## Dependências novas a instalar (via `npx expo install`, conforme Princípio IV)

- `@supabase/supabase-js` — cliente do Supabase Auth/Postgres.
- `expo-secure-store` — armazenamento seguro do token de sessão em iOS/Android.
- `react-native-url-polyfill` — polyfill de `URL` exigido pelo `supabase-js` em
  ambiente React Native (confirmado no quickstart oficial).
- `@react-native-async-storage/async-storage` — usado apenas como fallback do storage
  adapter na plataforma web (ver Decisão 1); não é o armazenamento de sessão em
  iOS/Android.

Todas compatíveis com Expo Go (nenhuma exige development build).
