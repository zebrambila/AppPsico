# Phase 0 Research: Persistência Real de Pacientes, Sessões e Financeiro

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION` — a spec já
passou por uma rodada de `/speckit-clarify` que resolveu as decisões de maior impacto
(bloqueio de exclusão de paciente com histórico, exigência de conexão para gravar).
Esta pesquisa cobre as decisões técnicas necessárias para implementar essas decisões.

## Decisão 1: Schema aplicado por SQL manual, sem Supabase CLI/migrations

- **Decision**: O schema das 4 tabelas novas (`contracts/schema.sql`) é escrito como um
  script SQL comum, para ser executado uma vez no SQL Editor do painel do Supabase —
  não há pasta `supabase/migrations/` nem uso do Supabase CLI neste repositório.
- **Rationale**: É exatamente o padrão já usado na spec 002 (Supabase Auth foi
  configurado pelo painel, não por CLI/migrations versionadas). Introduzir o Supabase
  CLI agora seria uma ferramenta/fluxo novo não usado em nenhuma outra parte do
  projeto, só para esta feature (Princípio V). O projeto é pequeno (uma profissional
  por conta) e não há múltiplos ambientes (staging/produção) a sincronizar que
  justifiquem migrations versionadas agora.
- **Alternatives considered**:
  - Supabase CLI + `supabase/migrations/*.sql` versionadas — rejeitada por adicionar
    uma dependência de ferramenta (CLI) e um fluxo de deploy novo não solicitado nem
    usado em nenhuma outra parte do repositório.
  - Um ORM (ex.: Drizzle, Prisma) gerando o schema — rejeitado por ser desproporcional
    ao tamanho do projeto (4 tabelas, uma consulta direta via `supabase-js` já é
    suficiente) e por introduzir uma camada de abstração especulativa (Princípio V).

## Decisão 2: Impedir exclusão de paciente com histórico via FK `ON DELETE RESTRICT`

- **Decision**: As colunas `paciente_id` em `sessoes`, `lancamentos` e `notas`
  referenciam `pacientes(id)` com `ON DELETE RESTRICT` (o padrão do Postgres já é
  `RESTRICT`, mas será declarado explicitamente para deixar a intenção clara no
  schema). Quando a psicóloga tentar excluir um paciente com qualquer linha
  dependente, o próprio Postgres rejeita a operação com um erro de violação de chave
  estrangeira; o cliente captura esse erro e exibe a mensagem de FR-009.
- **Rationale**: O banco garante a regra de forma atômica e correta mesmo sob
  concorrência (duas tentativas simultâneas, dois aparelhos), sem precisar duplicar a
  verificação "tem histórico?" no cliente antes de cada tentativa de exclusão — o que
  seria uma condição de corrida (TOCTOU) e uma lógica repetida em mais de um lugar.
- **Alternatives considered**:
  - Verificar no cliente (contar sessões/lançamentos/notas antes de chamar delete) e
    bloquear o botão — rejeitada como única linha de defesa: sujeita a condição de
    corrida e exigiria repetir a mesma regra em Postgres (para API routes externas) e
    no app; mantida apenas como UX (desabilitar o botão quando já se sabe que há
    histórico), nunca como a garantia real.
  - `ON DELETE CASCADE` com soft-delete (flag `arquivado`) — rejeitada porque a
    clarificação decidiu que não há arquivamento nesta feature: pacientes com
    histórico simplesmente não podem ser excluídos, ponto.

## Decisão 3: `AppStore` mantém o mesmo contrato público, trocando o estado em memória por chamadas ao Supabase

- **Decision**: `src/store/AppStore.tsx` continua expondo `useApp()` com os mesmos
  nomes já usados pelas telas (`pacientes`, `sessoes`, `lancamentos`, `notas`,
  `paciente()`, `agendarSessao()`, `registrarSessao()`, `confirmarSessao()`,
  `cobrar()`), mas agora:
  - os arrays (`pacientes`, `sessoes`, `lancamentos`, `notas`) são carregados uma vez
    via `supabase.from(...).select()` ao montar o `AppProvider` (após autenticação) e
    mantidos em estado React local, igual ao padrão atual;
  - cada método de escrita passa a ser assíncrono (`Promise<void>`, mesmo padrão já
    usado em `AuthStore.entrar`/`cadastrar`), grava no Supabase, e só então atualiza o
    estado local a partir da resposta do banco (sem estado otimista que precise ser
    revertido em caso de erro);
  - são adicionados `carregando: boolean` e `criarPaciente()`, `editarPaciente()`,
    `excluirPaciente()`, `marcarComoPago()` — operações novas exigidas pela spec que
    não existiam no contrato anterior (ver `contracts/app-store.md`).
- **Rationale**: Minimiza o raio de mudança — todas as telas que já chamam
  `useApp()` continuam funcionando sem reescrita, só passam a tratar os novos estados
  de carregamento/erro. Consistente com o padrão de erro já estabelecido no
  `AuthStore` (rejeitar a `Promise` com uma mensagem amigável).
- **Alternatives considered**:
  - Cada tela chamar `supabase.from(...)` diretamente — rejeitada por duplicar lógica
    de carregamento/erro/RLS em cada tela e quebrar o contrato único já estabelecido.
  - Introduzir React Query/SWR para cache e revalidação — rejeitada como
    desproporcional: não há requisito de atualização em tempo real entre dispositivos
    (a spec aceita "última gravação prevalece"), e o padrão atual (estado local +
    refetch após mutação) já atende a todos os FRs (Princípio V).

## Decisão 4: Escrita offline reaproveita `useConectividade` (spec 003)

- **Decision**: Antes de qualquer método de escrita do `AppStore` (criar/editar
  paciente, agendar sessão, registrar sessão, marcar como pago, excluir paciente)
  disparar a chamada ao Supabase, a tela chama `useConectividade()` (já criado em
  `src/hooks/useConectividade.ts` na spec 003); se não houver conexão, a tela mostra a
  mensagem de erro de FR-010 sem sequer tentar a chamada de rede.
- **Rationale**: Reaproveita a decisão e o código já existentes, em vez de reimplementar
  detecção de conectividade; mantém consistência de mensagem/comportamento entre a
  tela de Início (leitura) e as novas telas de escrita.
- **Alternatives considered**: depender só do erro de rede que o `supabase-js`
  devolveria ao tentar gravar sem conexão — rejeitada como única defesa porque o erro
  do cliente HTTP é menos imediato/claro do que checar `useConectividade()` antes de
  tentar, e ainda assim precisa ser tratado como reforço (timeout real durante a
  chamada), então ambos são usados: checagem prévia + tratamento do erro se a conexão
  cair durante a chamada em si.

## Decisão 5: Nova ação "Marcar como pago", distinta de "Cobrar"

- **Decision**: O lançamento financeiro já tem dois campos distintos no tipo
  `Lancamento`: `pago` (foi realmente pago) e `cobrado` (lembrete de cobrança
  enviado). A tela financeira hoje só tem o botão "Cobrar" (`cobrar()`, que marca
  `cobrado: true`); esta feature adiciona uma ação nova e separada, "Marcar como
  pago" (`marcarComoPago()`, que marca `pago: true` e pede o método de pagamento),
  satisfazendo o FR-007/AC3 da História 3 (que hoje não é alcançável na UI existente).
- **Rationale**: Evita confundir os dois conceitos (enviar lembrete vs. confirmar
  recebimento) sob o mesmo botão; mantém o campo `cobrado` com seu significado
  original em vez de redefini-lo.
- **Alternatives considered**: reaproveitar o botão "Cobrar" existente para também
  marcar como pago — rejeitada por misturar dois eventos de negócio diferentes
  (enviar lembrete ≠ confirmar recebimento) em uma única ação, o que tornaria o
  relatório financeiro ambíguo.

## Saída

Todas as incertezas técnicas do Technical Context foram resolvidas. Nenhum
`NEEDS CLARIFICATION` permanece. Pronto para a Fase 1 (data-model.md,
contracts/schema.sql, contracts/app-store.md, quickstart.md).
