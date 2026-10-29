# Feature Specification: Editar e Excluir (Individual e em Lote) Registro de Sessão, Prontuário e Financeiro

**Feature Branch**: `005-editar-excluir-registro`

**Created**: 2026-10-27 · **Revised**: 2026-10-28

**Status**: Draft

**Input**: User description: "Na tela de registro sessão, criar opção para permitir
editar e excluir sessão, prontuário e financeiro". Revisão 1: "Permitir que seja feita
a exclusão de um ou vários pagamentos, e também permitir que seja feita a exclusão de
uma ou várias sessões" — adicionou exclusão em lote. Revisão 2: "Ao excluir uma
sessão, excluir em cascata as anotações da sessão e também os pagamentos" — troca o
bloqueio de exclusão (decidido na clarificação anterior) por exclusão em cascata; a
parte da anotação de prontuário foi resolvida como arquivamento, não exclusão
definitiva, para preservar a retenção clínica exigida pelo Princípio III da
constituição do projeto (LGPD). **Revisão 3 (esta revisão)**: "Pacientes: não permitir
a exclusão física do paciente. Criar uma exclusão soft. Agenda: não permitir a
exclusão física da sessão. Criar uma exclusão soft. Financeiro: não permitir a
exclusão física do lançamento. Criar uma exclusão soft. Ao excluir um financeiro, o
registro de pagamento será excluído de forma soft/lógica. Ao excluir uma
nota/prontuário, o registro de nota será excluído de forma soft/lógica. Ao excluir
uma sessão, as notas da sessão e também o registro de pagamento serão excluídos de
forma soft/lógica." — generaliza a exclusão lógica (já decidida para a nota, na
Revisão 2) para **todas** as entidades desta funcionalidade: paciente, sessão,
lançamento financeiro e nota. Nenhum dado volta a ser apagado fisicamente do
armazenamento por esta funcionalidade; a exclusão em cascata ao excluir uma sessão
(Revisão 2) passa a ser feita marcando os registros vinculados como excluídos, em vez
de apagar o lançamento de verdade.

## Clarifications

### Session 2026-10-27

- Q: Quais sessões devem ficar protegidas (sem poder ser excluídas) pela tela de registro? → A: Bloquear a exclusão quando houver anotação de atendimento OU lançamento financeiro vinculado (qualquer um dos dois já protege a sessão). **(substituído pela revisão de exclusão em cascata, e depois pela exclusão lógica universal — ver Revisão 3)**

### Session 2026-10-27 (revisão — exclusão em lote)

- Q: Quando uma exclusão em lote de sessões inclui algumas bloqueadas (com anotação/lançamento) e outras não, o sistema deve excluir as permitidas e manter as bloqueadas (parcial), ou cancelar a ação inteira se qualquer uma da seleção estiver bloqueada? → A: Parcial, por item. **(sem efeito prático após a revisão de cascata — nenhuma sessão fica mais bloqueada por nota/lançamento; só a falha de conexão interrompe o processamento de uma seleção, ver FR-014)**
- Q: A seleção em lote de sessões deve funcionar só dentro do dia atualmente aberto na Agenda, ou precisa alcançar sessões de vários dias/semanas ao mesmo tempo? → A: Só o dia atualmente aberto na Agenda, sobre a lista já existente.

### Session 2026-10-27 (revisão — exclusão em cascata)

- Q: Ao excluir uma sessão, o lançamento financeiro vinculado também deve ser excluído automaticamente (em vez de bloquear a exclusão)? → A: Sim — excluir a sessão sempre afeta em cascata o lançamento financeiro vinculado, sem bloqueio. **(Revisão 3: essa exclusão em cascata do lançamento passa a ser lógica/soft, não física — ver abaixo)**
- Q: Ao excluir uma sessão, a anotação de atendimento (prontuário) vinculada também deve ser apagada permanentemente em cascata? → A: Não apagar de fato — **arquivar em cascata** (opção C): a anotação some das listagens normais do prontuário, mas seu conteúdo é preservado internamente, nunca excluído de verdade, para manter a retenção clínica exigida pelo Princípio III da constituição.

### Session 2026-10-28 (revisão 3 — exclusão lógica/soft-delete universal)

- Q: Ao excluir (soft-delete) um paciente, os registros vinculados a ele (sessões,
  lançamentos e notas) também devem ser marcados como excluídos em cascata, ou só o
  paciente fica marcado como excluído e os registros vinculados continuam ativos no
  sistema? → A: Cascata completa — excluir um paciente marca o paciente e também
  todas as suas sessões, lançamentos e notas vinculados como excluídos, todos de
  forma lógica/soft (nenhum dado é apagado fisicamente).
- Q: Se a psicóloga excluir a nota de uma sessão (História 7) e depois reabrir o
  registro dessa mesma sessão e escrever uma nova anotação, o sistema deve criar uma
  nota nova, ou "reativar" a nota excluída preenchendo-a com o novo texto? → A: Cria
  uma nota nova, independente da antiga; a nota excluída permanece excluída e
  intocada, preservando o texto que tinha no momento da exclusão.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editar um registro de sessão sem duplicar dados (Priority: P1)

Uma psicóloga reabre a tela de registro de uma sessão já registrada anteriormente
(presença, pagamento e anotação já salvos) para corrigir algo — por exemplo, trocar o
método de pagamento ou completar a anotação — e, ao salvar, os dados existentes são
atualizados, não duplicados.

**Why this priority**: Hoje reabrir o registro de uma sessão já registrada não traz os
dados salvos de volta para a tela (a anotação, por exemplo, sempre aparece vazia) e
salvar de novo cria uma anotação duplicada em vez de atualizar a existente. Sem
corrigir isso primeiro, qualquer tentativa de "editar" piora o problema ao invés de
resolvê-lo.

**Independent Test**: Pode ser testado isoladamente registrando uma sessão com uma
anotação e um pagamento, reabrindo o registro dessa mesma sessão, confirmando que os
campos aparecem preenchidos com o que foi salvo, alterando um deles e salvando, e
confirmando que não aparecem anotações ou lançamentos duplicados para essa sessão.

**Acceptance Scenarios**:

1. **Given** uma sessão já registrada com presença, pagamento e anotação salvos,
   **When** a psicóloga reabre o registro dessa sessão, **Then** os campos de
   presença, pagamento (e método) e anotação aparecem preenchidos com os valores já
   salvos, não em branco.
2. **Given** a tela de registro reaberta com os dados preenchidos, **When** a
   psicóloga altera um campo (ex.: método de pagamento) e salva, **Then** o registro
   existente é atualizado com o novo valor, sem criar um registro duplicado.
3. **Given** uma sessão já registrada com uma anotação salva, **When** a psicóloga
   reabre o registro, edita o texto da anotação e salva, **Then** a mesma anotação é
   atualizada com o novo texto, em vez de uma segunda anotação ser criada para a mesma
   sessão.

---

### User Story 2 - Excluir uma sessão registrada por engano, sem perder o histórico (Priority: P1)

Uma psicóloga que registrou uma sessão por engano (ex.: duplicada, ou sessão que nunca
deveria ter sido criada) a exclui diretamente pela tela de registro. Ao confirmar, a
sessão, o lançamento financeiro vinculado e a anotação de atendimento vinculada são
todos marcados como excluídos (exclusão lógica) — deixam de aparecer em qualquer
lista normal, mas nenhum deles é apagado de fato do sistema.

**Why this priority**: Sessões duplicadas ou criadas por engano (ex.: pelo bug de
"registrar" criar uma nova sessão a cada tentativa) precisam de uma forma explícita de
correção; sem exclusão, o histórico acumula lixo que distorce a agenda e os relatórios
financeiros. A exclusão deve, ao mesmo tempo, limpar completamente a visão da
psicóloga (sessão, lançamento e anotação somem juntos) e nunca apagar de fato dados
clínicos ou financeiros, já que qualquer exclusão pode ter sido um engano e pode
precisar de auditoria futura.

**Independent Test**: Pode ser testado isoladamente criando uma sessão de teste com um
lançamento financeiro e uma anotação vinculados, excluindo-a pela tela de registro, e
confirmando que: a sessão, o lançamento e a anotação somem de todas as listas (agenda,
início, financeiro, prontuário); e, com acesso direto ao banco de dados, que as três
linhas continuam existindo, apenas marcadas como excluídas.

**Acceptance Scenarios**:

1. **Given** uma sessão com um lançamento financeiro vinculado, **When** a psicóloga
   solicita excluí-la pela tela de registro e confirma, **Then** a sessão e o
   lançamento financeiro vinculado são marcados como excluídos, e ambos deixam de
   aparecer em qualquer lista, sem serem apagados do sistema.
2. **Given** uma sessão com uma anotação de atendimento vinculada, **When** a
   psicóloga solicita excluí-la pela tela de registro e confirma, **Then** a sessão é
   marcada como excluída, e a anotação vinculada também é marcada como excluída
   (some do prontuário visível do paciente), sem ter seu conteúdo apagado do sistema.
3. **Given** uma exclusão de sessão solicitada, **When** a psicóloga ainda não
   confirmou, **Then** o sistema pede confirmação explícita antes de excluir,
   informando que o lançamento financeiro vinculado e qualquer anotação vinculada
   também serão marcados como excluídos.

---

### User Story 3 - Corrigir ou remover só o lançamento financeiro de uma sessão (Priority: P2)

Uma psicóloga que registrou o pagamento de uma sessão incorretamente (ex.: marcou como
paga por engano, ou com o método errado) corrige ou remove apenas o lançamento
financeiro vinculado a essa sessão, sem precisar excluir a sessão.

**Why this priority**: É um ajuste mais comum e de menor risco do que excluir a
sessão inteira; separar essa correção evita que a psicóloga precise apagar e recriar
a sessão só para corrigir um dado financeiro.

**Independent Test**: Pode ser testado isoladamente registrando uma sessão com
pagamento marcado incorretamente, usando a opção de remover/corrigir o lançamento
pela tela de registro, e confirmando que o valor some (ou é corrigido) no resumo
financeiro, enquanto a sessão continua intacta.

**Acceptance Scenarios**:

1. **Given** uma sessão registrada com um lançamento financeiro vinculado, **When** a
   psicóloga altera o status de pagamento ou o método pela tela de registro e salva,
   **Then** o lançamento é atualizado de acordo (já coberto pela edição da História 1).
2. **Given** uma sessão registrada com um lançamento financeiro marcado por engano,
   **When** a psicóloga solicita remover esse lançamento especificamente (mantendo a
   sessão), **Then** o lançamento é marcado como excluído e o valor some dos resumos
   financeiros, sem afetar a sessão e sem apagar o lançamento do sistema.

---

### User Story 4 - Excluir várias sessões de uma vez, sem perder o histórico (Priority: P2)

Uma psicóloga, a partir da lista de sessões (Agenda), seleciona várias sessões ao
mesmo tempo e solicita excluí-las em uma única ação. Cada sessão selecionada é
marcada como excluída junto com seu lançamento financeiro vinculado e qualquer
anotação vinculada — o mesmo comportamento da História 2, aplicado a cada item da
seleção.

**Why this priority**: Sessões de teste ou duplicadas (ex.: geradas pelo bug corrigido
na História 1) costumam aparecer em grupo; sem exclusão em lote, corrigir isso exige
repetir a mesma ação várias vezes.

**Independent Test**: Pode ser testado isoladamente criando, no mesmo dia da Agenda,
várias sessões de teste com lançamentos e anotações vinculados, selecionando todas
para exclusão em lote e confirmando, e verificando que todas as sessões e seus
lançamentos e anotações vinculados são marcados como excluídos e somem das listas,
sem nenhum dado apagado de fato.

**Acceptance Scenarios**:

1. **Given** várias sessões selecionadas na lista de sessões do dia aberto na Agenda,
   **When** a psicóloga confirma a exclusão em lote, **Then** todas as sessões
   selecionadas, seus lançamentos financeiros vinculados e qualquer anotação
   vinculada a cada uma são marcados como excluídos, e todas deixam de aparecer em
   qualquer lista normal.
2. **Given** uma exclusão em lote de sessões solicitada, **When** a psicóloga ainda
   não confirmou, **Then** o sistema pede confirmação explícita informando quantas
   sessões (e seus lançamentos/anotações vinculados) serão afetadas pela ação.

---

### User Story 5 - Excluir vários lançamentos financeiros de uma vez (Priority: P2)

Uma psicóloga, a partir da lista de lançamentos (tela Financeiro), seleciona vários
lançamentos e os remove em uma única ação, sem precisar abrir a tela de registro de
cada sessão vinculada individualmente.

**Why this priority**: Lançamentos incorretos (ex.: duplicados, criados por engano)
também costumam aparecer em grupo; corrigir um por um é lento quando o problema afeta
várias sessões ao mesmo tempo.

**Independent Test**: Pode ser testado isoladamente criando 2 lançamentos de teste,
selecionando-os na tela financeira, confirmando a remoção em lote, e confirmando que
ambos somem dos resumos financeiros (sem serem apagados do sistema) enquanto as
sessões vinculadas continuam intactas.

**Acceptance Scenarios**:

1. **Given** vários lançamentos selecionados na lista de lançamentos, **When** a
   psicóloga confirma a remoção em lote, **Then** todos os lançamentos selecionados
   são marcados como excluídos e os valores somem dos resumos financeiros, sem afetar
   as sessões vinculadas e sem apagar nenhum lançamento do sistema.
2. **Given** uma remoção em lote de lançamentos solicitada, **When** a psicóloga
   ainda não confirmou, **Then** o sistema pede confirmação explícita informando
   quantos lançamentos e qual valor total serão afetados.
3. **Given** nenhum lançamento selecionado, **When** a psicóloga tenta iniciar a
   remoção em lote, **Then** a ação permanece indisponível até que pelo menos um
   lançamento seja selecionado.

---

### User Story 6 - Excluir um paciente sem perder o histórico clínico e financeiro (Priority: P1)

Uma psicóloga que não atende mais um paciente (ex.: encerramento de processo
terapêutico, cadastro duplicado ou feito por engano) o exclui a partir da ficha do
paciente. Ao confirmar, o paciente e **todo** o seu histórico vinculado — sessões,
lançamentos financeiros e notas de atendimento — são marcados como excluídos de uma
só vez; nenhum dado é apagado fisicamente.

**Why this priority**: Excluir um paciente é a ação mais abrangente desta
funcionalidade (afeta todo o histórico dele de uma vez) e também a de maior risco se
feita incorretamente — dados clínicos e financeiros de um paciente real nunca podem
ser perdidos por engano. Resolver isso com a mesma prioridade de "editar sem
duplicar" (História 1) e "excluir sessão em cascata" (História 2) garante que a
funcionalidade inteira já nasça sem exclusão física em nenhum ponto.

**Independent Test**: Pode ser testado isoladamente cadastrando um paciente de teste
com pelo menos uma sessão, um lançamento e uma nota vinculados, excluindo o paciente
pela ficha dele, e confirmando que: o paciente some da lista de pacientes; suas
sessões somem da Agenda e do Início; seu lançamento some do Financeiro; sua nota some
do prontuário (que, de todo modo, deixou de ser acessível porque o paciente não
aparece mais); e, com acesso direto ao banco de dados, que todas essas linhas
continuam existindo, apenas marcadas como excluídas.

**Acceptance Scenarios**:

1. **Given** um paciente cadastrado com sessões, lançamentos e notas vinculados,
   **When** a psicóloga solicita excluir esse paciente pela ficha dele e confirma,
   **Then** o paciente é marcado como excluído e some da lista de pacientes, e todas
   as suas sessões, lançamentos e notas vinculados também são marcados como
   excluídos e somem de qualquer lista normal (Agenda, Início, Financeiro,
   Prontuário).
2. **Given** uma exclusão de paciente solicitada, **When** a psicóloga ainda não
   confirmou, **Then** o sistema pede confirmação explícita informando que o
   paciente e todo o seu histórico de sessões, lançamentos e notas serão afetados.
3. **Given** um paciente já excluído, **When** qualquer tela do sistema é consultada
   (lista de pacientes, Agenda, Início, Financeiro), **Then** nenhum dado desse
   paciente ou de seu histórico aparece, como se tivesse sido removido de fato.

---

### User Story 7 - Excluir uma nota de prontuário específica (Priority: P2)

Uma psicóloga que registrou uma anotação de atendimento por engano, ou que não deveria
ter sido salva (ex.: anotação de teste, ou anotação criada para o paciente errado), a
remove diretamente pela aba "Prontuário" da ficha do paciente, sem precisar excluir a
sessão ou o lançamento vinculados.

**Why this priority**: É um ajuste pontual e de menor abrangência do que excluir a
sessão inteira (História 2); mesmo assim precisa estar disponível, porque uma
anotação de prontuário também pode conter um engano que precisa ser corrigido sem
afetar o restante do registro da sessão.

**Independent Test**: Pode ser testado isoladamente registrando uma sessão com uma
anotação de teste, excluindo apenas a nota pela aba "Prontuário", e confirmando que a
nota some do prontuário do paciente, enquanto a sessão e o lançamento vinculados (se
houver) continuam intactos.

**Acceptance Scenarios**:

1. **Given** uma nota de atendimento listada no prontuário do paciente, **When** a
   psicóloga solicita excluí-la e confirma, **Then** a nota é marcada como excluída e
   some da lista normal do prontuário, sem afetar a sessão ou o lançamento
   vinculados a ela, e sem ser apagada do sistema.
2. **Given** uma exclusão de nota solicitada, **When** a psicóloga ainda não
   confirmou, **Then** o sistema pede confirmação explícita antes de excluir.

---

### Edge Cases

- O que acontece ao excluir uma sessão que tem lançamento financeiro vinculado? O
  lançamento é marcado como excluído automaticamente junto, sempre, sem bloqueio
  (FR-006).
- O que acontece ao excluir uma sessão que tem anotação de atendimento (prontuário)
  vinculada? A anotação é marcada como excluída automaticamente (some da lista normal
  do prontuário do paciente), mas seu conteúdo não é apagado do sistema (FR-007).
- O que acontece ao excluir um paciente que tem sessões, lançamentos e/ou notas
  vinculados? Todos são marcados como excluídos em cascata, junto com o paciente
  (FR-016), e deixam de aparecer em qualquer lista — mesmo que a psicóloga só tenha
  pedido para excluir o paciente, sem mencionar o histórico dele.
- O que acontece se a psicóloga abrir a ficha do paciente depois de excluir uma sessão
  que tinha anotação? A anotação excluída não aparece na aba "Prontuário"; esta
  funcionalidade não inclui uma tela para visualizar ou restaurar pacientes, sessões,
  lançamentos ou notas excluídos (ver Assumptions).
- O que acontece se a psicóloga editar o registro de uma sessão que já tem lançamento
  pago e muda a presença para "faltou" ou "remarcou"? O lançamento vinculado deixa de
  fazer sentido e é removido automaticamente (comportamento já existente, preservado
  por esta funcionalidade — agora também como exclusão lógica).
- O que acontece se não houver conexão com a internet ao tentar editar ou excluir? A
  ação falha com uma mensagem clara, sem deixar dados parciais (mesmo padrão das specs
  003 e 004).
- O que acontece se a conexão cair no meio de uma exclusão em lote, com alguns itens
  já processados e outros não? O sistema informa quantos já haviam sido processados
  com sucesso antes da falha, sem reportar a ação como totalmente concluída (FR-014).
- É possível selecionar sessões e lançamentos ao mesmo tempo, em uma única seleção
  combinada? Não — a seleção em lote é feita separadamente em cada lista (sessões na
  Agenda, lançamentos no Financeiro); não há uma seleção combinada entre as duas.
- Se a psicóloga excluir só o lançamento pela História 3 e depois excluir a sessão
  pela História 2, há algo para excluir em cascata além da própria sessão? O
  lançamento já está marcado como excluído; a sessão apenas marca também como
  excluída a anotação vinculada, se houver (um lançamento já excluído não precisa ser
  marcado de novo).
- Um relatório ou resumo (ex.: saldo em aberto, total de sessões realizadas) deve
  considerar pacientes, sessões, lançamentos ou notas excluídos? Não — todo cálculo,
  contagem ou soma desta funcionalidade ignora registros marcados como excluídos, da
  mesma forma que ignoraria um registro que tivesse sido apagado de fato (FR-019).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao abrir a tela de registro de uma sessão já registrada, o sistema DEVE
  preencher os campos de presença, status de pagamento, método de pagamento e
  anotação com os valores já salvos para essa sessão (em vez de valores em branco ou
  padrão).
- **FR-002**: Ao salvar a edição de uma sessão já registrada, o sistema DEVE
  atualizar o registro de presença existente, em vez de criar um novo.
- **FR-003**: Ao salvar a edição de uma sessão já registrada, o sistema DEVE
  atualizar o lançamento financeiro vinculado existente (quando houver), em vez de
  criar um lançamento duplicado.
- **FR-004**: Ao salvar a edição de uma sessão já registrada, o sistema DEVE
  atualizar a anotação de atendimento **ativa** (não excluída) vinculada existente
  (quando houver e o texto for alterado), em vez de criar uma anotação duplicada para
  a mesma sessão. Se a sessão não tiver nenhuma anotação ativa (porque a única
  anotação que existia foi excluída pela História 7) e a psicóloga escrever uma nova
  anotação, o sistema DEVE criar uma nota nova e independente, sem reativar ou
  sobrescrever a anotação excluída, que permanece intocada.
- **FR-005**: O sistema DEVE oferecer, na tela de registro de sessão, uma opção para
  excluir a sessão, com um pedido de confirmação explícito antes de executar a
  exclusão, informando que o lançamento vinculado e qualquer anotação vinculada
  também serão marcados como excluídos.
- **FR-006**: Ao excluir uma sessão, o sistema DEVE marcar automaticamente como
  excluído, sem bloqueio e sem apagá-lo fisicamente, o lançamento financeiro
  vinculado a ela (quando houver).
- **FR-007**: Ao excluir uma sessão que tenha uma anotação de atendimento (prontuário)
  vinculada, o sistema DEVE marcar essa anotação automaticamente como excluída
  (removendo-a das listagens normais do prontuário do paciente) em vez de apagá-la de
  fato ou de bloquear a exclusão da sessão — o conteúdo da anotação permanece
  armazenado, nunca é apagado por esta funcionalidade.
- **FR-008**: O sistema DEVE oferecer, na tela de registro de sessão, uma opção para
  remover (excluir logicamente) especificamente o lançamento financeiro vinculado a
  essa sessão (mantendo a sessão intacta), com confirmação antes de excluir.
- **FR-009**: Quando uma ação de editar ou excluir não puder ser concluída por falta
  de conexão ou outra falha, o sistema DEVE informar claramente que a ação não foi
  salva, sem deixar dados parciais.
- **FR-010**: O sistema DEVE permitir, na lista de sessões do dia atualmente aberto na
  Agenda, selecionar uma ou várias sessões desse dia e solicitar a exclusão de todas
  em uma única ação, com confirmação explícita informando quantas sessões serão
  afetadas.
- **FR-011**: Ao executar uma exclusão em lote de sessões, o sistema DEVE aplicar a
  mesma regra de exclusão em cascata da História 2 (FR-006, FR-007) a cada sessão
  individualmente: lançamento vinculado e anotação vinculada, ambos marcados como
  excluídos.
- **FR-012**: Como nenhuma sessão fica bloqueada para exclusão (FR-006/FR-007 sempre
  processam o item), uma exclusão em lote de sessões DEVE marcar todas as sessões
  selecionadas como excluídas com sucesso, exceto quando a conexão cair no meio do
  processamento (ver FR-014).
- **FR-013**: O sistema DEVE permitir, na lista de lançamentos financeiros
  (Financeiro), selecionar um ou vários lançamentos e marcá-los como excluídos em uma
  única ação, com confirmação explícita informando quantos lançamentos e qual valor
  total serão afetados.
- **FR-014**: Quando uma exclusão em lote (de sessões ou de lançamentos) não puder
  ser concluída por completo por falta de conexão no meio do processamento, o sistema
  DEVE informar quantos itens já haviam sido processados com sucesso antes da falha,
  sem reportar a ação como totalmente concluída.
- **FR-015**: O sistema DEVE oferecer, na ficha do paciente, uma opção para excluir o
  paciente, com um pedido de confirmação explícito informando que o paciente e todo o
  seu histórico vinculado (sessões, lançamentos e notas) serão marcados como
  excluídos.
- **FR-016**: Ao excluir um paciente, o sistema DEVE marcar automaticamente como
  excluídos, em cascata e sem apagá-los fisicamente, todas as sessões, todos os
  lançamentos financeiros e todas as notas de atendimento vinculados a esse paciente.
- **FR-017**: O sistema DEVE oferecer, na aba "Prontuário" da ficha do paciente, uma
  opção para excluir uma nota de atendimento específica, com confirmação antes de
  excluir, sem afetar a sessão ou o lançamento vinculados a ela.
- **FR-018**: Nenhuma ação de exclusão desta funcionalidade — de paciente, sessão,
  lançamento ou nota, individual ou em lote — DEVE remover fisicamente um registro do
  armazenamento. Toda exclusão desta funcionalidade é lógica: o registro é marcado
  como excluído e passa a ser omitido das listagens normais, mas permanece armazenado.
- **FR-019**: Toda listagem, resumo ou cálculo que exibe ou soma pacientes, sessões,
  lançamentos ou notas (lista de Pacientes, Agenda, Início, Financeiro, Prontuário,
  saldos e totais) DEVE omitir registros marcados como excluídos, como se tivessem
  sido removidos de fato.

### Key Entities *(include if feature involves data)*

- **Paciente**: Já existente; passa a ter um estado de **excluído** (nova distinção
  de domínio: ativo vs. excluído). Excluir um paciente marca esse estado e também
  marca, em cascata, todas as suas sessões, lançamentos e notas vinculados como
  excluídos. Nunca é apagado fisicamente por esta funcionalidade.
- **Sessão**: Já existente (spec 004); passa a poder ser editada (presença) e
  excluída a partir da tela de registro, e passa a ter um estado de **excluída**.
  Excluir uma sessão marca esse estado e também marca, em cascata, o lançamento
  financeiro e a nota vinculados como excluídos, quando houver. Nunca é apagada
  fisicamente por esta funcionalidade.
- **Lançamento Financeiro**: Já existente; passa a poder ser atualizado sem
  duplicação, removido isoladamente (exclusão lógica), ou marcado como excluído em
  cascata junto com a sessão ou o paciente que o originou. Passa a ter um estado de
  **excluído**; nunca é apagado fisicamente por esta funcionalidade.
- **Nota de Atendimento (Prontuário)**: Já existente; passa a poder ser atualizada
  sem duplicação a partir da tela de registro, excluída individualmente pela aba
  Prontuário, ou marcada como excluída em cascata ao excluir a sessão ou o paciente
  vinculados. O estado de **excluída** (já introduzido na Revisão 2 como
  "arquivada") passa a ser o mesmo mecanismo de exclusão lógica usado por todas as
  demais entidades desta funcionalidade. Nunca é apagada fisicamente por esta
  funcionalidade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das reaberturas da tela de registro de uma sessão já registrada
  mostram os dados realmente salvos (presença, pagamento, anotação), não valores em
  branco ou padrão.
- **SC-002**: 0% das edições de uma sessão já registrada resultam em anotações ou
  lançamentos duplicados para essa mesma sessão.
- **SC-003**: 100% das exclusões de sessão marcam também como excluído o lançamento
  financeiro vinculado (quando houver), sem exigir uma ação manual separada, e sem
  apagá-lo fisicamente.
- **SC-004**: Psicólogas conseguem corrigir um lançamento financeiro incorreto sem
  precisar recriar a sessão, em 100% dos casos em que a sessão não precisa ser
  alterada.
- **SC-005**: Psicólogas conseguem excluir 5 sessões de teste em uma única ação de
  confirmação, em vez de 5 ações separadas, com seus lançamentos e notas vinculados
  também marcados como excluídos.
- **SC-006**: 100% das exclusões em lote de sessões marcam também como excluídos os
  lançamentos financeiros vinculados a cada sessão excluída.
- **SC-007**: Psicólogas conseguem remover 5 lançamentos financeiros incorretos em
  uma única ação de confirmação, em vez de 5 ações separadas.
- **SC-008**: 0% dos pacientes, sessões, lançamentos ou notas excluídos por esta
  funcionalidade (individual ou em lote) são apagados de forma física/irrecuperável —
  100% deles permanecem armazenados, apenas marcados como excluídos.
- **SC-009**: 100% das exclusões de paciente removem, das listas ativas (Pacientes,
  Agenda, Início, Financeiro, Prontuário), também todas as sessões, lançamentos e
  notas vinculados a esse paciente, em uma única ação de confirmação.
- **SC-010**: 0% dos saldos, totais ou contagens exibidos no app (ex.: saldo em
  aberto, total de sessões realizadas) consideram pacientes, sessões, lançamentos ou
  notas marcados como excluídos.

## Assumptions

- Esta funcionalidade atua sobre pacientes, sessões, lançamentos e notas já criados
  pelas specs 002/004 (persistência real); não introduz novas entidades, mas
  adiciona um novo estado (**excluído**) a cada uma das quatro.
- Toda exclusão desta funcionalidade — paciente, sessão, lançamento ou nota,
  individual ou em lote — é lógica (soft-delete): o registro nunca é apagado do
  armazenamento, apenas marcado como excluído e omitido das listagens e cálculos
  normais. Isso vale mesmo quando a intenção da psicóloga é "limpar" algo por
  completo, e satisfaz a retenção clínica exigida pelo Princípio III da constituição
  do projeto (LGPD) sem exigir distinção especial para a nota de prontuário (que já
  seguia essa lógica desde a Revisão 2, sob o nome "arquivada").
- Excluir uma sessão sempre marca como excluídos, em cascata, o lançamento financeiro
  e a nota de atendimento vinculados a ela (quando houver), sem bloqueio e sem exigir
  que a psicóloga os remova manualmente antes.
- Excluir um paciente sempre marca como excluídos, em cascata, todas as sessões,
  lançamentos e notas vinculados a ele — a cascata do paciente é completa, não parcial
  (decisão explícita desta revisão).
- Esta funcionalidade não inclui uma tela para visualizar, restaurar ou excluir
  definitivamente pacientes, sessões, lançamentos ou notas já marcados como
  excluídos — eles simplesmente deixam de aparecer em qualquer lista ou cálculo
  normal. Se no futuro for necessário auditar ou recuperar registros excluídos, isso
  é um fluxo separado (ex.: uma tela administrativa), fora deste escopo.
- A remoção isolada do lançamento financeiro (História 3) e da nota de atendimento
  (História 7) continua disponível para quem só quer corrigir um item específico sem
  tocar no restante do registro.
- Editar/excluir exige conexão com a internet no momento da ação, consistente com o
  padrão já adotado nas specs 003 e 004 (sem edição/exclusão offline com sincronização
  posterior).
- A seleção em lote acontece nas telas de lista já existentes (Agenda para sessões,
  Financeiro para lançamentos), não na tela de registro de sessão.
- Não há um limite artificial de quantos itens podem ser selecionados de uma vez,
  dentro do volume esperado de uso de uma profissional individual.
- A seleção em lote de sessões alcança apenas as sessões do dia atualmente aberto na
  Agenda (mesma lista de um dia já existente), não uma visualização nova que cruze
  vários dias/semanas de uma vez.
