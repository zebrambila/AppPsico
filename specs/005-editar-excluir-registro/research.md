# Phase 0 Research: Editar e Excluir (Individual e em Lote) Registro de Sessão, Prontuário e Financeiro

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION`. As
Decisões 1-4 cobrem a Parte 1; as Decisões 5-6 cobrem a Parte 2; as Decisões 7-8
cobriam a Parte 3 (nunca aplicada em produção). **As Decisões 9-12 cobrem a Parte 4
desta revisão (exclusão lógica/soft-delete universal) e substituem por completo as
Decisões 7-8** — não há mais FK `CASCADE`/`SET NULL`, nem distinção entre "excluir de
fato" (lançamento) e "arquivar" (nota): as 4 entidades passam a usar o mesmo
mecanismo.

## Decisão 1 (SUBSTITUÍDA pela Decisão 9): Reaproveitar a FK `ON DELETE RESTRICT` já existente como a garantia real de bloqueio

- Histórico, sem efeito prático desde a Parte 3/4. Ver Decisão 9.

## Decisão 2: Corrigir o prefill de presença para todos os status possíveis (FR-001)

- **Decision**: Em `sessao/registrar.tsx`, mapear o `status` salvo da sessão para o
  valor inicial de `presenca` de forma completa: `'realizada'` → `'compareceu'`,
  `'faltou'` → `'faltou'`, `'remarcada'` → `'remarcou'`; para sessões ainda não
  registradas (`'pendente'`/`'confirmada'`) ou sem sessão existente, o padrão
  permanece `'compareceu'` como sugestão inicial (comportamento já existente).
- **Rationale**: O código atual só trata `'faltou'` como caso especial e assume
  `'compareceu'` para qualquer outro status, incluindo `'remarcada'` — o que
  significa que reabrir o registro de uma sessão remarcada mostra "Compareceu"
  selecionado por padrão, contradizendo o que foi salvo (viola FR-001).
- **Alternatives considered**: Nenhuma — é a correção direta do mapeamento, sem
  decisão de design em aberto.

## Decisão 3: Nota existente é atualizada, não duplicada — agora só entre notas ativas (FR-004)

- **Decision**: Em `AppStore.registrarSessao`, antes de decidir entre inserir ou
  atualizar a nota, buscar `notas.find(n => n.sessaoId === base.id && !n.excluida)` —
  ou seja, apenas entre notas **ativas** (não excluídas). Se existir e o texto novo
  for diferente (ou simplesmente sempre que o campo não estiver vazio), fazer
  `update` nela; se não existir nenhuma nota ativa (seja porque nunca houve nota,
  seja porque a única que havia foi excluída pela História 7), fazer `insert` de uma
  nota nova e independente — nunca reativando ou sobrescrevendo uma nota já excluída.
  Em `sessao/registrar.tsx`, o campo de anotação inicia preenchido com o texto da
  nota ativa existente (`notaAtivaExistente?.texto ?? ''`), em vez de sempre `''`.
- **Rationale**: É a correção mínima do bug relatado (cada reabertura e salvamento
  gerava uma duplicata) combinada com a decisão da clarificação desta revisão: uma
  nota excluída nunca deve ser "trazida de volta" por uma edição posterior — ela fica
  congelada no estado em que estava ao ser excluída.
- **Alternatives considered**: Manter um histórico de várias notas por sessão (um
  "log" de anotações ao longo do tempo) — rejeitado porque a spec (e o modelo de
  dados já existente) trata a nota ativa como um registro único por sessão, não um
  diário; introduzir isso agora seria uma mudança de modelo de dados fora do escopo
  pedido.

## Decisão 4: Remover lançamento isoladamente, agora como exclusão lógica

- **Decision**: `removerLancamento(lancamentoId)` executa
  `update({ excluido: true })` em `lancamentos` pelo id, em vez de `delete`.
  Diferente de sessões/pacientes, nenhuma outra tabela referencia `lancamentos.id`
  como chave estrangeira, então não há cascata a propagar a partir daqui — é a
  exclusão mais simples das quatro entidades.
- **Rationale**: Reflete a Decisão 1 do research.md da spec 004 (schema): lançamentos
  são o "fim da cadeia" de referências. A única mudança desta revisão é marcar em vez
  de apagar.
- **Alternatives considered**: Nenhuma — não há ambiguidade técnica aqui.

## Decisão 5: Exclusão em lote processa um `UPDATE` por item, nunca um `UPDATE ... WHERE id IN (...)` único (FR-010 a FR-014)

- **Decision**: `excluirSessoesEmLote(sessaoIds)` chama `excluirSessao(id)` em
  sequência para cada id da seleção, dentro de um laço que captura o resultado de
  cada chamada individualmente: sucesso vai para a lista de "excluídas", e o laço só
  é interrompido antes do fim se ocorrer uma falha genuína (ex.: conexão cair no meio
  do processamento — FR-014), retornando também quais ids ainda não foram
  processados nesse caso. `removerLancamentosEmLote(ids)` segue o mesmo padrão sobre
  `removerLancamento(id)`.
- **Rationale**: Processar um item por vez permite reportar com precisão onde um
  lote parou em caso de falha de conexão (FR-014) — a única razão restante para não
  usar um `UPDATE` multi-linha único, já que nenhum item fica bloqueado por regra de
  negócio (isso não existe mais desde a Parte 3/4).
- **Alternatives considered**:
  - `UPDATE ... WHERE id IN (...)` único — rejeitado porque, em caso de falha de
    conexão no meio, não haveria como saber quais itens já tinham sido marcados.
  - Uma função/procedure no Postgres que itere internamente — rejeitada como
    complexidade desproporcional (Princípio V).

## Decisão 6: Modo de seleção múltipla local a cada tela, sem componente compartilhado novo

- **Decision**: `src/app/(tabs)/agenda.tsx` e `src/app/(tabs)/financeiro.tsx` mantêm,
  cada uma independentemente, um estado local `selecionando: boolean` e
  `selecionados: Set<string>` (ids), alternados por um botão "Selecionar"/"Cancelar"
  no cabeçalho da lista; quando `selecionando` é `true`, tocar em um item alterna sua
  seleção (em vez de navegar), e uma barra inferior mostra a contagem (e, no
  Financeiro, o valor total selecionado) com um botão de ação que confirma via
  `confirmarAcao` antes de chamar `excluirSessoesEmLote`/`removerLancamentosEmLote`.
- **Rationale**: Apenas 2 telas precisam de seleção múltipla; uma abstração de
  "lista selecionável" genérica compartilhada não paga pelo esforço de
  generalização agora (Princípio V).
- **Alternatives considered**: Extrair um hook/componente genérico reutilizável —
  rejeitado como abstração especulativa para apenas 2 usos concretos.

## Decisão 7 (SUBSTITUÍDA pela Decisão 9): Exclusão em cascata via FK do banco

- Histórico — essa migração (`ON DELETE CASCADE`/`SET NULL`) nunca foi aplicada em
  produção. Esta revisão a descarta por completo em favor da Decisão 9.

## Decisão 8 (SUBSTITUÍDA pela Decisão 9 e Decisão 12): Nota vinculada é "arquivada"

- Histórico — o mecanismo e o nome `arquivada` são generalizados e renomeados para
  `excluida` em todas as 4 entidades. Ver Decisões 9 e 12.

## Decisão 9: Exclusão lógica universal via coluna booleana por tabela, sem FK `CASCADE`/`SET NULL` (FR-006, FR-007, FR-015, FR-016, FR-018)

- **Decision**: Cada uma das 4 tabelas (`pacientes`, `sessoes`, `lancamentos`,
  `notas`) ganha uma coluna booleana própria (`excluido`/`excluida`, padrão
  `false`). Nenhuma dessas tabelas recebe mais `DELETE` de nenhuma função desta
  funcionalidade — toda exclusão é um `UPDATE` marcando a coluna como `true`. A
  cascata é feita no cliente, como uma sequência de `UPDATE`s nas tabelas
  dependentes antes de marcar a própria linha:
  - `excluirSessao(id)`: marca como excluídos o(s) lançamento(s) e a(s) nota(s)
    ativa(s) vinculados (`sessao_id = id`), depois marca a própria sessão.
  - `excluirPaciente(id)`: marca como excluídas todas as sessões do paciente, todos
    os lançamentos do paciente e todas as notas do paciente (três `UPDATE`s por
    `paciente_id`, sem depender de já ter excluído cada sessão individualmente),
    depois marca o próprio paciente.
- **Rationale**: O banco já não precisa modelar a cascata via FK, porque nenhuma
  linha é apagada de verdade — não há nada para o Postgres "cascatear" em um
  `DELETE` que nunca acontece. Uma coluna booleana simples, filtrada na leitura
  (Decisão 10), é o mecanismo mais direto para "existe, mas não aparece mais"
  (Princípio V), e generaliza para as 4 entidades sem precisar de 2 mecanismos
  diferentes (como a Parte 3 teria exigido: `CASCADE` para lançamento, `SET NULL` +
  coluna para nota).
- **Alternatives considered**:
  - Manter a abordagem da Parte 3 (FK `CASCADE`/`SET NULL`, "arquivar" só a nota) e
    adicionar uma coluna de exclusão lógica só para paciente/sessão — rejeitada por
    criar 2 mecanismos diferentes para o mesmo conceito ("excluído", mas às vezes via
    FK, às vezes via coluna), mais difícil de raciocinar e testar do que um único
    mecanismo uniforme.
  - Usar `deleted_at timestamp` em vez de `boolean` — rejeitada como complexidade
    desnecessária; nenhum requisito desta spec precisa saber *quando* algo foi
    excluído, só *se* foi (Princípio V).
  - Trigger de banco para propagar a cascata automaticamente — rejeitada como
    complexidade desproporcional para uma app de uso individual; a sequência de
    `UPDATE`s no cliente já segue o mesmo padrão aprovado para lote (Decisão 5).

## Decisão 10: Filtrar exclusões na query inicial (servidor), não em cada tela (FR-019)

- **Decision**: As queries que carregam `pacientes`, `sessoes`, `lancamentos` e
  `notas` no `AppStore` (ao autenticar/montar o app) passam a incluir
  `.eq('excluido', false)` / `.eq('excluida', false)`. Nenhum seletor ou tela
  (`sessoesDoDia`, Agenda, Financeiro, Início, Prontuário, lista de Pacientes)
  precisa adicionar um filtro próprio — o estado local do `AppStore` simplesmente
  nunca contém um registro excluído.
- **Rationale**: Um único ponto de verdade elimina o risco de esquecer o filtro em
  alguma tela nova ou existente (o que violaria FR-019 silenciosamente). Também
  reduz o que é transferido para o cliente à medida que registros excluídos se
  acumulam ao longo do tempo.
- **Alternatives considered**: Carregar tudo e filtrar em cada seletor — rejeitada
  por duplicar a mesma regra em vários lugares, com risco real de inconsistência
  (como aconteceu na Parte 3, em que só uma tela — `paciente/[id]/index.tsx` —
  precisava do filtro; agora são 5 pontos de consumo).

## Decisão 11: Cascata do paciente marca sessões, lançamentos e notas diretamente por `paciente_id`, não encadeando `excluirSessao` por sessão

- **Decision**: `excluirPaciente` não chama `excluirSessao` em loop para cada
  sessão do paciente; em vez disso, executa diretamente 3 `UPDATE`s por
  `paciente_id` (um em `sessoes`, um em `lancamentos`, um em `notas`), e só então
  marca o próprio paciente.
- **Rationale**: É estritamente mais simples e mais rápido (3 chamadas de rede fixas
  em vez de `1 + 2N` para N sessões do paciente) e alcança o mesmo resultado, porque
  a cascata do paciente é sempre completa (decisão confirmada via `/speckit-clarify`)
  — não há caso em que uma sessão do paciente deveria ficar de fora.
- **Alternatives considered**: Reaproveitar `excluirSessao` em loop por sessão do
  paciente — rejeitada por ser mais lenta sem nenhum benefício, já que o resultado
  final (tudo marcado como excluído) é idêntico.

## Decisão 12: Campo `arquivada` da Revisão 2 é renomeado para `excluida`, unificando a terminologia (FR-007, FR-017)

- **Decision**: O campo (e, na migração desta revisão, a coluna) antes chamado
  `arquivada` passa a se chamar `excluida` em `Nota`, e passa a ser marcado pela
  mesma lógica usada nas outras 3 entidades. Como a migração da Parte 3 nunca foi
  aplicada em produção (coluna `arquivada` nunca existiu de fato no banco), esse é
  um simples renome de nome planejado, sem custo de migração extra.
- **Rationale**: Duas palavras diferentes ("arquivada" vs. "excluída") para o mesmo
  conceito de domínio (registro preservado, mas fora da visão normal) são uma
  inconsistência terminológica sem benefício, especialmente agora que o mesmo
  mecanismo se aplica a 4 entidades.
- **Alternatives considered**: Manter `arquivada` só para nota, por já estar
  "decidida" — rejeitada por gerar inconsistência de nomenclatura sem necessidade
  real, já que a coluna nunca chegou a existir em produção.

## Saída

Todas as decisões técnicas estão resolvidas, incluindo a migração de schema desta
revisão (Decisões 9-12). Pronto para a Fase 1 (data-model.md,
contracts/migracao-exclusao-logica.sql, quickstart.md).
