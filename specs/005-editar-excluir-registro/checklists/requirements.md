# Specification Quality Checklist: Editar e Excluir Registro de Sessão, Prontuário e Financeiro

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-27
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- **Revisão 2026-10-27 (exclusão em cascata)**: a psicóloga pediu que a exclusão de
  sessão passe a excluir em cascata o lançamento financeiro e a anotação de
  atendimento vinculados. O lançamento passa a ser excluído de fato (baixo risco,
  aplicado diretamente). Para a anotação de prontuário, a pergunta sobre reverter a
  proteção de retenção clínica (Princípio III da constituição / LGPD) foi respondida
  pelo usuário: **arquivar em cascata (opção C)** — a anotação some do prontuário
  normal, mas seu conteúdo nunca é apagado de fato.
- **Revisão 2026-10-28 (exclusão lógica/soft-delete universal)**: a psicóloga pediu
  que nenhuma entidade desta funcionalidade (paciente, sessão, lançamento, nota)
  volte a ser apagada fisicamente — toda exclusão passa a ser lógica, generalizando o
  mecanismo já usado para a nota (antes chamado "arquivada") para as demais. Também
  adicionou exclusão de paciente (nova História 6, com cascata completa para
  sessões/lançamentos/notas — decisão confirmada via clarificação formal) e exclusão
  individual de nota (nova História 7). Nenhum item pendente.
- **Clarificação 2026-10-28**: resolvida a interação entre excluir uma nota (História
  7) e depois escrever uma nova anotação na mesma sessão — o sistema cria uma nota
  nova e independente; a nota excluída permanece intocada (FR-004 atualizado).
  Nenhum item pendente.
