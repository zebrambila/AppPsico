# Feature Specification: Persistência Real de Pacientes, Sessões e Financeiro

**Feature Branch**: `004-persistir-dados-clinicos`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Modelar e persistir no Supabase os dados hoje mockados
em memória no AppStore: pacientes, sessões e lançamentos financeiros, substituindo os
dados de exemplo por tabelas reais vinculadas à psicóloga autenticada."

## Clarifications

### Session 2026-10-26

- Q: Quando uma psicóloga "exclui" um paciente que já tem histórico (sessões/financeiro/notas), esse arquivamento deve poder ser desfeito depois (reativar o paciente), ou é uma decisão definitiva? → A: Não permitir remover/arquivar pacientes com histórico nesta funcionalidade; a psicóloga precisa manter todos os pacientes com histórico sempre na lista ativa.
- Q: Quando a psicóloga tenta cadastrar um paciente, agendar uma sessão ou registrar um pagamento/nota sem conexão com a internet, o app deve bloquear a ação e pedir para conectar, ou permitir salvar localmente um rascunho que sincroniza depois? → A: Bloquear a ação e exigir conexão — sem suporte a rascunho local/sincronização posterior nesta funcionalidade.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar pacientes que permanecem salvos (Priority: P1)

Uma psicóloga cadastra um novo paciente (nome, frequência, dia/horário fixo,
modalidade, valor da sessão, data de início, telefone) e, ao reabrir o app em outro
momento — ou em outro aparelho, usando a mesma conta —, encontra esse paciente e todos
os seus dados exatamente como foram salvos, não mais um conjunto fixo de pacientes de
exemplo.

**Why this priority**: Sem pacientes reais e persistentes, nenhuma outra funcionalidade
do app (agenda, financeiro, prontuário) tem dados de verdade para operar — é a base de
tudo o que vem depois.

**Independent Test**: Pode ser testado isoladamente cadastrando um paciente, encerrando
e reabrindo o app (ou trocando de aparelho com a mesma conta), e confirmando que o
paciente e seus dados continuam lá, idênticos.

**Acceptance Scenarios**:

1. **Given** uma psicóloga autenticada, **When** ela cadastra um novo paciente com os
   dados obrigatórios, **Then** o paciente passa a aparecer na lista de pacientes e
   permanece lá após encerrar e reabrir o app.
2. **Given** um paciente já cadastrado, **When** a psicóloga edita seus dados (ex.:
   valor da sessão, telefone), **Then** a mudança é refletida em qualquer lugar do app
   que exiba esse paciente e persiste entre aberturas do app.
3. **Given** duas contas diferentes de psicólogas, **When** cada uma cadastra seus
   próprios pacientes, **Then** nenhuma consegue ver, listar ou editar os pacientes
   cadastrados pela outra conta.

---

### User Story 2 - Agendar sessões reais vinculadas aos pacientes (Priority: P1)

Uma psicóloga agenda, confirma, registra (presença/falta) e consulta sessões vinculadas
aos pacientes reais cadastrados na História 1; essas sessões continuam existindo e com
o status correto em qualquer momento futuro em que o app for aberto.

**Why this priority**: A agenda e o resumo diário (tela de Início) dependem de sessões
reais para deixar de ser uma simulação; é o segundo pilar de dados que destrava o uso
real do app no dia a dia.

**Independent Test**: Pode ser testado isoladamente agendando uma sessão para um
paciente real, confirmando-a, registrando-a como realizada, e confirmando que o status
e os dados da sessão persistem após reabrir o app.

**Acceptance Scenarios**:

1. **Given** um paciente real cadastrado, **When** a psicóloga agenda uma sessão para
   ele, **Then** a sessão aparece na agenda, no resumo do dia (quando for hoje) e
   permanece com os mesmos dados após reabrir o app.
2. **Given** uma sessão agendada e pendente de confirmação, **When** a psicóloga a
   confirma, **Then** o novo status é salvo e refletido em qualquer tela que exiba essa
   sessão, de forma persistente.
3. **Given** uma sessão do dia, **When** a psicóloga a registra como realizada, faltou
   ou remarcada, **Then** esse registro definitivo é salvo e não se perde ao reabrir o
   app.

---

### User Story 3 - Registrar pagamentos e notas de atendimento persistentes (Priority: P2)

Uma psicóloga registra se uma sessão realizada foi paga (e por qual método) e
opcionalmente adiciona uma nota de atendimento vinculada a essa sessão; esses registros
financeiros e de prontuário continuam disponíveis em qualquer momento futuro, compondo o
histórico real do paciente.

**Why this priority**: Fecha o ciclo iniciado pela sessão (História 2): sem pagamentos e
notas persistentes, o financeiro e o prontuário continuam sendo apenas uma demonstração,
mesmo com pacientes e sessões já reais.

**Independent Test**: Pode ser testado isoladamente registrando uma sessão como
realizada com pagamento confirmado e uma nota de atendimento, e confirmando que o
lançamento financeiro e a nota aparecem no histórico do paciente e no resumo financeiro
após reabrir o app.

**Acceptance Scenarios**:

1. **Given** uma sessão registrada como realizada, **When** a psicóloga marca o
   pagamento como feito e informa o método, **Then** um lançamento financeiro é salvo e
   contabilizado nos resumos financeiros, de forma persistente.
2. **Given** uma sessão registrada, **When** a psicóloga escreve uma nota de
   atendimento, **Then** essa nota é salva vinculada ao paciente e à sessão, e aparece
   no histórico/prontuário em qualquer sessão futura de uso do app.
3. **Given** um lançamento financeiro em aberto, **When** a psicóloga realiza a
   cobrança/recebimento posteriormente, **Then** o lançamento passa a status pago de
   forma persistente, refletido nos resumos financeiros.

---

### Edge Cases

- O que acontece quando a psicóloga tenta excluir um paciente que já tem sessões,
  lançamentos financeiros ou notas de atendimento vinculados? A exclusão é bloqueada
  por completo (nem arquivamento nem exclusão definitiva) e o paciente continua na
  lista ativa — dado que prontuários e registros financeiros de pacientes são dados
  que profissionais de saúde costumeiramente precisam preservar por obrigação
  legal/ética (ver FR-009).
- O que acontece se a conexão com a internet cair no meio de uma ação de salvar (criar
  paciente, agendar sessão, registrar pagamento)? A ação deve falhar de forma clara, sem
  salvar dados parciais/inconsistentes, e sem fingir que foi concluída.
- Como o sistema impede que uma psicóloga veja ou altere dados (pacientes, sessões,
  financeiro, notas) pertencentes à conta de outra psicóloga?
- O que acontece quando duas edições à mesma sessão ou ao mesmo paciente ocorrem em
  sequência rápida (ex.: a psicóloga usando o app em dois aparelhos ao mesmo tempo)? A
  edição mais recente salva com sucesso deve prevalecer, sem travar o app.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que uma psicóloga autenticada cadastre um novo
  paciente com nome, frequência, dia e horário fixo, modalidade, valor padrão da
  sessão, data de início e telefone, e DEVE persistir esses dados de forma que
  sobrevivam ao fechamento do app, a reinstalações e a trocas de aparelho (usando a
  mesma conta).
- **FR-002**: O sistema DEVE permitir editar os dados de um paciente já cadastrado,
  persistindo as mudanças da mesma forma que o cadastro inicial.
- **FR-003**: O sistema DEVE garantir que cada paciente, sessão, lançamento financeiro
  e nota de atendimento pertença a exatamente uma conta de psicóloga, e que nenhuma
  conta consiga listar, ler, criar, editar ou excluir dados pertencentes a outra conta.
- **FR-004**: O sistema DEVE permitir agendar uma sessão vinculada a um paciente
  existente da mesma conta, com data, horário, modalidade, valor e duração, persistindo
  esses dados.
- **FR-005**: O sistema DEVE permitir alterar o status de uma sessão (confirmar;
  registrar como realizada, faltou ou remarcada), persistindo o novo status.
- **FR-006**: O sistema DEVE permitir registrar, para uma sessão realizada, se o
  pagamento foi feito e por qual método, criando um lançamento financeiro persistente
  vinculado a essa sessão e ao paciente.
- **FR-007**: O sistema DEVE permitir marcar um lançamento financeiro em aberto como
  pago posteriormente (cobrança), persistindo essa mudança de status.
- **FR-008**: O sistema DEVE permitir adicionar uma nota de atendimento vinculada a uma
  sessão e ao paciente, persistindo o texto da nota para consulta futura no
  histórico/prontuário do paciente.
- **FR-009**: Quando uma psicóloga solicitar excluir um paciente que possua sessões,
  lançamentos financeiros ou notas vinculados, o sistema DEVE impedir a exclusão por
  completo (nem o paciente nem seu histórico são apagados ou ocultados), informando
  claramente por que a exclusão não é permitida; o paciente permanece na lista de
  pacientes ativos. A exclusão só é permitida para pacientes sem nenhuma sessão,
  lançamento financeiro ou nota vinculados.
- **FR-010**: Quando uma ação de salvar dados (cadastrar paciente, agendar sessão,
  registrar pagamento ou nota) não puder ser concluída por falta de conexão ou outra
  falha, o sistema DEVE informar claramente que a ação não foi salva, sem deixar dados
  parciais ou inconsistentes, e sem indicar sucesso.
- **FR-011**: O sistema DEVE continuar oferecendo as mesmas telas e fluxos hoje
  existentes para pacientes, agenda, financeiro e prontuário, agora operando sobre os
  dados reais persistidos em vez dos dados de exemplo fixos.
- **FR-012**: O sistema DEVE preservar a associação correta entre sessão, lançamento
  financeiro e nota mesmo após edições (ex.: editar uma sessão não deve desvincular seu
  lançamento financeiro ou suas notas existentes).

### Key Entities *(include if feature involves data)*

- **Psicóloga (conta)**: Dona de todos os dados abaixo; já existe como conta de
  autenticação (spec 002) — aqui passa a também ser o dono de pacientes, sessões,
  lançamentos e notas.
- **Paciente**: Nome, iniciais, frequência, dia/horário fixo, modalidade, valor padrão
  da sessão, data de início, telefone; só pode ser excluído enquanto não tiver nenhuma
  sessão, lançamento financeiro ou nota vinculados (FR-009).
- **Sessão**: Data, horário, status (pendente, confirmada, realizada, faltou,
  remarcada), modalidade, valor, duração; vinculada a um paciente.
- **Lançamento Financeiro**: Valor, data, status de pagamento, método de pagamento;
  vinculado a uma sessão e a um paciente.
- **Nota de Atendimento**: Texto, data; vinculada a uma sessão e a um paciente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos pacientes, sessões, lançamentos financeiros e notas cadastrados
  por uma conta continuam disponíveis, sem perda ou corrupção de dados, após reabrir o
  app, reinstalar o app ou trocar de aparelho usando a mesma conta.
- **SC-002**: 0% dos pacientes, sessões, lançamentos ou notas de uma conta são visíveis
  ou editáveis a partir de outra conta, em qualquer cenário testado.
- **SC-003**: 100% das tentativas de excluir um paciente com histórico vinculado são
  bloqueadas com uma mensagem clara do motivo, sem apagar nem ocultar paciente ou
  histórico.
- **SC-004**: Ações de salvar dados que falham por falta de conexão são reportadas
  claramente à usuária em até 3 segundos, sem gerar registros parciais.

## Assumptions

- Esta funcionalidade substitui a fonte dos dados hoje gerados em
  `src/data/mock.ts`/`AppStore` por persistência real; não há necessidade de "migrar"
  os dados de exemplo atuais, pois eles são apenas dados de demonstração para
  desenvolvimento — cada conta real passa a começar sem pacientes cadastrados.
- Pacientes com qualquer histórico vinculado (sessões, financeiro ou notas) não podem
  ser excluídos nesta funcionalidade, permanecendo sempre na lista ativa — alinhado à
  prática comum de retenção de prontuário/financeiro em profissões de saúde
  regulamentadas. Pacientes sem nenhum histórico vinculado podem ser excluídos
  definitivamente. Um eventual fluxo de arquivamento (ocultar sem apagar) ou de remoção
  definitiva sob solicitação do titular dos dados (LGPD) fica fora do escopo desta
  funcionalidade e deve ser tratado separadamente, caso venha a ser necessário.
- O conflito de edições concorrentes (ex.: mesma conta em dois aparelhos) é resolvido
  por "a última gravação bem-sucedida prevalece", sem necessidade de mesclagem manual
  nesta funcionalidade.
- As telas, fluxos e regras de negócio hoje existentes (ex.: cálculo de resumo
  financeiro mensal, tela de Início da spec 003) continuam as mesmas; esta
  funcionalidade troca apenas a fonte dos dados, não o comportamento das telas.
