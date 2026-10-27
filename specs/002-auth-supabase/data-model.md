# Data Model: Login, Criar Conta e Recuperação de Senha com Contas Persistentes

**Feature**: `002-auth-supabase` | **Date**: 2026-10-24

Esta feature não introduz tabelas próprias no banco do Supabase (ver
[research.md](./research.md) — Decisão 2): as entidades abaixo descrevem o modelo
observável pelo app, apoiado em `auth.users` e no mecanismo de recuperação de senha
nativos do Supabase Auth.

## Conta de usuária (psicóloga)

Representa a profissional que usa o sistema. Mapeada para um registro de
`auth.users` do Supabase; os campos específicos do domínio ficam em `user_metadata`.

| Campo | Fonte | Obrigatório | Regras de validação (da spec) |
|---|---|---|---|
| `id` | `auth.users.id` (gerado pelo Supabase) | — | Não editável pelo app; chave de toda a sessão. |
| `email` | `auth.users.email` | Sim | Formato de e-mail válido (FR-005); único por conta — tentativa de cadastro duplicado é rejeitada (FR-002). |
| `senha` | gerenciada pelo Supabase Auth (nunca lida/exposta pelo app) | Sim | Mínimo 8 caracteres e confirmação de senha idêntica no cadastro (FR-005). Nunca persistida localmente nem em texto puro (Princípio III). |
| `nome` | `user_metadata.nome` | Sim | Usado em saudações e iniciais de avatar (`iniciaisDe`); sem formato específico além de não vazio. |
| `crp` | `user_metadata.crp` | Não | Texto livre, sem verificação contra registro oficial (FR-014). |
| `celular` | `user_metadata.celular` | Não | Texto livre; sem validação de formato especificada. |

**Transições de estado relevantes**:
- `inexistente → ativa`: criada via cadastro (User Story 2); fica ativa e
  utilizável imediatamente, sem etapa de confirmação de e-mail (FR-013).
- `ativa, senha A → ativa, senha B`: ocorre ao concluir a recuperação de senha (User
  Story 3); a partir desse momento, a senha A deixa de ser aceita (FR-007).

## Solicitação de redefinição de senha

Não é uma entidade persistida pelo app — representa o estado do fluxo de recuperação
mantido pelo próprio Supabase Auth (link/token de recuperação por e-mail). O app só
observa seu resultado através dos parâmetros recebidos na rota de deep link
(`token_hash`, `type=recovery`) e do sucesso/falha da chamada que os consome.

| Campo observado | Significado | Regras (da spec) |
|---|---|---|
| `email` | e-mail para o qual a recuperação foi solicitada | Resposta de confirmação de envio é idêntica exista ou não conta com esse e-mail (FR-006, SC-006). |
| `token_hash` / `type` | parâmetros do link recebido por e-mail, lidos pela rota `redefinir-senha` | Uso repetido ou expirado é rejeitado com mensagem orientando nova solicitação (FR-008). |
| estado derivado | pendente / consumido (com sucesso) / expirado-ou-já-usado | Determinado pela resposta da chamada de verificação do token; o app não guarda esse estado entre sessões. |

## Relação com o restante do app

Nenhuma outra entidade do app (paciente, sessão, lançamento financeiro — ver
`src/data/mock.ts`) é modificada por esta feature. A relação de que cada conta só
acessa seus próprios dados (isolamento multi-tenant) é tratada como premissa herdada
do spec (`Assumptions`), não como um requisito de modelagem desta feature.
