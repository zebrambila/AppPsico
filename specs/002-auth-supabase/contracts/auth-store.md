# Contrato: `useAuth()` (AuthStore)

**Feature**: `002-auth-supabase` | **Date**: 2026-10-24

Este é o único "contrato" externo relevante desta feature: a interface que as telas de
login, cadastro, esqueci-senha e redefinir-senha (e o `Stack.Protected` do layout raiz)
usam para interagir com a autenticação, hoje exposta por `src/store/AuthStore.tsx`. É
um contrato interno de módulo (padrão de aplicação), não uma API de rede exposta pelo
app — nenhuma outra interface externa é adicionada por esta feature.

Este documento descreve o comportamento observável exigido pelo spec; não prescreve a
implementação interna do hook.

## Estado exposto

| Campo | Tipo | Descrição |
|---|---|---|
| `usuario` | `Usuario \| null` | Conta autenticada atual, ou `null` sem sessão ativa. Deve refletir a sessão persistida restaurada na abertura do app (FR-003), não apenas o estado em memória. |
| `carregando` | `boolean` | `true` enquanto a sessão persistida ainda está sendo restaurada na abertura do app, antes de decidir se mostra área autenticada ou telas de login/cadastro. |

## Operações

### `entrar(email: string, senha: string): Promise<void>`
- **Sucesso**: resolve e `usuario` passa a refletir a conta autenticada (FR-004, US1).
- **Falha** (credenciais inválidas, e-mail inexistente, ou falha de rede): rejeita com
  um erro cuja mensagem é a mesma para "e-mail inexistente" e "senha incorreta"
  (FR-004, SC-006) e uma mensagem distinta para falha de comunicação (Edge Cases).
  Os campos da tela não são limpos pela chamada — a tela é responsável por preservá-los.

### `cadastrar(dados: CadastroInput): Promise<void>`
- **Entrada**: `{ nome, email, senha, crp?, celular? }` (FR-001).
- **Sucesso**: cria a conta de forma persistente e já autentica a usuária (`usuario`
  passa a refletir a nova conta) — sem etapa de confirmação de e-mail (FR-013).
- **Falha**: rejeita com erro específico quando o e-mail já está em uso (FR-002); erro
  de validação (senha curta, confirmação divergente, termos não aceitos) é
  responsabilidade da tela antes de chamar `cadastrar` (FR-005) — `cadastrar` pode
  assumir que recebeu dados já validados nesse sentido.

### `sair(): void`
- Encerra a sessão local (`usuario` volta a `null`) e remove o token persistido do
  armazenamento seguro do dispositivo (FR-011, Princípio III — não deixar sessão
  residual após logout).

### `solicitarRecuperacaoSenha(email: string): Promise<void>`
- **Sempre resolve** (nunca rejeita por "e-mail não encontrado"), confirmando o envio
  das instruções de forma idêntica para e-mails com ou sem conta (FR-006, SC-006). Só
  rejeita em caso de falha de comunicação genérica (Edge Cases).

### `redefinirSenha(novaSenha: string): Promise<void>`
- Chamada pela tela aberta a partir do link de recuperação (deep link), já com uma
  sessão de recuperação temporária estabelecida pela rota (ver
  [research.md](./../research.md) — Decisão 3).
- **Sucesso**: a nova senha passa a ser aceita e a anterior deixa de funcionar (FR-007).
- **Falha**: se o link/token de recuperação já foi usado ou expirou, rejeita com um
  erro que a tela traduz na orientação de solicitar uma nova recuperação (FR-008).

## Garantias transversais (todas as operações)

- Nenhuma operação deixa mais de uma tentativa em voo simultaneamente para a mesma
  ação (a tela controla isso desabilitando o reenvio durante `Promise` pendente —
  FR-009), mas o próprio hook não impõe fila: é responsabilidade de cada tela.
- Nenhum dado de paciente, prontuário ou financeiro é lido ou exposto por este módulo
  — seu contrato é estritamente sobre identidade e sessão da psicóloga (Princípio III).
