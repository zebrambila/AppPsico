-- Feature 005-editar-excluir-registro (revisão — exclusão lógica/soft-delete universal)
-- Executar uma vez no SQL Editor do painel do Supabase.
--
-- Substitui por completo a migração da Parte 3 (migracao-cascata.sql), que alterava
-- as ações ON DELETE das FKs (CASCADE/SET NULL) e nunca foi aplicada em produção
-- (tarefa T022 da Parte 3 ficou pendente). Com esta revisão, nenhuma linha das 4
-- tabelas abaixo volta a ser apagada fisicamente por esta funcionalidade — não há
-- mais necessidade de alterar nenhuma ação ON DELETE.
--
-- Cada tabela ganha uma coluna booleana própria para a exclusão lógica. Todas
-- iniciam em `false` (nada já existente fica "excluído" por acidente).

alter table public.pacientes
  add column excluido boolean not null default false;

alter table public.sessoes
  add column excluida boolean not null default false;

alter table public.lancamentos
  add column excluido boolean not null default false;

alter table public.notas
  add column excluida boolean not null default false;

-- Nenhum índice extra é necessário no volume de dados esperado (uso de uma única
-- profissional); se o volume crescer muito, um índice parcial do tipo
-- `create index on <tabela> (psicologa_id) where não excluido` pode ser considerado
-- depois, fora do escopo desta revisão.
