# Quickstart de Validação: Login, Criar Conta e Recuperação de Senha

**Feature**: `002-auth-supabase` | **Date**: 2026-10-24

Guia para validar manualmente que a feature funciona de ponta a ponta, conforme os
critérios de sucesso do [spec.md](./spec.md). Não é um teste automatizado (ver
[research.md](./research.md) — Decisão 4).

## Pré-requisitos

1. Um projeto Supabase criado, com:
   - A URL do projeto e a chave pública (`anon key`) disponíveis como variáveis de
     ambiente do app (ex.: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
   - Em **Authentication → URL Configuration**, adicionar à lista de *Redirect URLs*
     permitidas: `psico://redefinir-senha` (para testar em iOS/Android com uma
     development build) **e** a URL http(s) que o `npx expo start --web` usa
     localmente, com `/redefinir-senha` no final (ex.: `http://localhost:8081/redefinir-senha`
     — confira a porta exata na barra de endereço do navegador). Sem isso, o link de
     recuperação de senha é rejeitado pelo Supabase. Ver [research.md](./research.md)
     — Decisão 3 sobre por que a URL muda por plataforma.
   - Em **Authentication → Email Templates → Reset Password**, substituir o link que
     usa `{{ .ConfirmationURL }}` por um que usa `{{ .TokenHash }}` e `{{ .RedirectTo }}`
     diretamente:
     ```html
     <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Redefinir senha</a>
     ```
     Sem essa troca, o e-mail linka para o endpoint hospedado do próprio Supabase (que
     usa `{{ .ConfirmationURL }}` por padrão) em vez de ir direto para a rota
     `redefinir-senha` do app com `token_hash`/`type` na URL — e a tela mostra "Link
     inválido ou expirado" mesmo com o link recém-enviado (ver
     [research.md](./research.md) — Decisão 3).
   - Confirmação de e-mail **desativada** em **Authentication → Providers → Email**
     (consistente com FR-013: conta ativa imediatamente após o cadastro).
2. Dependências instaladas (ver [research.md](./research.md) — seção final):
   ```bash
   npx expo install @supabase/supabase-js expo-secure-store react-native-url-polyfill @react-native-async-storage/async-storage
   ```
3. `npx expo start` rodando, app aberto no Expo Go (iOS ou Android) ou simulador.

## Cenário 1 — Criar conta e cair direto na área principal (US2, FR-001, FR-002, FR-013)

1. Abra a tela de login e toque em "Criar conta".
2. Preencha nome, um e-mail ainda não usado, senha com 8+ caracteres, confirme a senha
   e aceite os termos. Toque em "Criar conta".
3. **Esperado**: sem nenhuma etapa extra de confirmação de e-mail, o app leva
   diretamente à tela Início.
4. Repita o cadastro com o **mesmo e-mail**.
5. **Esperado**: erro informando que o e-mail já está em uso; nenhuma segunda conta é
   criada.

## Cenário 2 — Sair e entrar novamente com a conta criada (US1, FR-003, FR-004)

1. Na área principal, toque no avatar para sair (logout).
2. Na tela de login, informe o e-mail e a senha usados no Cenário 1.
3. **Esperado**: acesso concedido à área principal — confirma que a conta persistiu
   além da sessão em que foi criada (SC-001).
4. Force o fechamento do app e reabra-o.
5. **Esperado**: a sessão continua autenticada sem pedir login novamente (login
   persistente, ver Assumptions do spec), a menos que o passo 1 tenha feito logout.

## Cenário 3 — Credenciais inválidas não revelam se o e-mail existe (US1, FR-004, SC-006)

1. Na tela de login, informe um e-mail **sem conta** e qualquer senha. Anote a
   mensagem de erro exata.
2. Informe o e-mail de uma conta real (Cenário 1) com a **senha errada**. Compare a
   mensagem de erro com a do passo 1.
3. **Esperado**: as duas mensagens são idênticas — nenhuma indica qual campo estava
   errado nem se a conta existe.

## Cenário 4 — Recuperar senha dentro do app (US3, FR-006, FR-007, FR-008, FR-015, SC-005)

**Nota sobre a plataforma de teste**: em iOS/Android, o link de e-mail só abre o app
de forma garantida numa development build (`npx expo run:ios|android` ou
`eas build --profile development`) — o esquema customizado `psico://` não é resolvido
de forma confiável no Expo Go, que usa `exp://` para si mesmo. Testar pelo **navegador**
(`npx expo start --web`) evita essa limitação, pois o app usa uma URL http(s) comum
nesse caso (ver research.md — Decisão 3) — é o caminho recomendado enquanto não houver
uma development build.

1. Na tela de login, toque em "Esqueci minha senha" e informe o e-mail de uma conta
   real. Confirme que a tela mostra a confirmação de envio.
2. Repita o passo 1 com um e-mail **sem conta**.
3. **Esperado**: a confirmação exibida é idêntica à do passo 1 (SC-006).
4. Abra o e-mail recebido no passo 1 (apenas a conta real recebe e-mail de fato) e
   toque no link de redefinição.
5. **Esperado**: o app abre diretamente em uma tela de "definir nova senha" — sem
   passar por um navegador/página web externa (FR-015).
6. Defina uma nova senha válida e confirme.
7. Faça logout e tente entrar com a senha **antiga**.
8. **Esperado**: acesso negado — a senha antiga não funciona mais (FR-007).
9. Entre com a **nova** senha.
10. **Esperado**: acesso concedido.
11. Toque novamente no mesmo link de e-mail do passo 4 (reutilizando-o).
12. **Esperado**: erro orientando a solicitar uma nova recuperação (FR-008), em vez de
    permitir redefinir a senha de novo com o link já usado.

## Cenário 5 — Validação de campos antes do envio (US4, FR-005)

1. Em cada um dos três formulários (login, criar conta, esqueci senha), informe um
   e-mail em formato inválido (ex.: `fulano@`) e tente enviar.
2. **Esperado**: mensagem "Informe um e-mail válido." no campo, e nenhuma chamada de
   rede é disparada (verificável observando que nenhum indicador de carregamento
   aparece).
3. No cadastro, teste separadamente: senha com menos de 8 caracteres; confirmação de
   senha diferente da senha; termos não marcados.
4. **Esperado**: cada caso exibe sua mensagem de erro específica e bloqueia o envio.

## Cenário 6 — Falha de rede preserva os dados digitados (Edge Cases)

1. Desative a conexão de rede do dispositivo/emulador.
2. Tente entrar com credenciais válidas.
3. **Esperado**: mensagem de erro de comunicação (diferente da mensagem de credenciais
   inválidas do Cenário 3), e os campos de e-mail/senha permanecem preenchidos.

## Gates finais (Princípio II da constituição)

```bash
npx expo lint
npx tsc --noEmit
```

Ambos devem rodar sem erros antes de considerar a feature concluída.
