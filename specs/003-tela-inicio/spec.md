# Feature Specification: Tela de Início (Painel do Dia)

**Feature Branch**: `003-tela-inicio`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "a tela de Inicio"

## Clarifications

### Session 2026-10-26

- Q: Quando a usuária abre a tela de Início sem conexão com a internet, o que ela deve ver? → A: A tela bloqueia o acesso e exibe uma mensagem de erro exigindo conexão para continuar.
- Q: Nomes de pacientes e valores financeiros devem aparecer diretamente na tela de Início assim que ela abre, ou algum dado sensível precisa de uma ação extra antes de ser exibido? → A: Nomes de pacientes aparecem normalmente; valores financeiros (a receber, valor da sessão) ficam ocultos por padrão até a usuária tocar para revelar.
- Q: Quando a sessão em destaque como "próxima sessão" termina seu horário enquanto a usuária ainda está com a tela de Início aberta, a tela deve atualizar automaticamente para a sessão seguinte, ou só ao reabrir/recarregar a tela? → A: A tela atualiza automaticamente o destaque para a próxima sessão elegível, sem exigir que a usuária saia e volte.
- Q: Depois que a usuária toca para revelar um valor financeiro mascarado, esse valor deve voltar a ficar oculto automaticamente após um tempo, ou só quando ela tocar novamente para ocultar? → A: O valor permanece revelado até a usuária tocar novamente para ocultá-lo (sem ocultação automática por tempo).
- Q: O estado "revelado" de um valor financeiro deve resetar para oculto cada vez que a usuária abre a tela de Início (ou o app) de novo, ou deve ser lembrado entre aberturas? → A: Resetar para oculto a cada nova abertura da tela/app, independentemente de ter sido revelado antes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o resumo do dia ao abrir o app (Priority: P1)

Uma psicóloga abre o app e cai na tela de Início, onde vê imediatamente um resumo do seu
dia: saudação com o próprio nome, data atual, quantas sessões tem hoje, quantas já
foram realizadas, e quanto tem a receber em pagamentos pendentes.

**Why this priority**: É a primeira tela que a usuária vê após o login e a visão geral
que orienta todo o resto do uso do app no dia. Sem ela, a usuária não tem um ponto de
partida para decidir o que fazer a seguir.

**Independent Test**: Pode ser testado isoladamente entrando na conta com sessões e
pagamentos cadastrados para o dia atual, e confirmando que a saudação, a data, a
contagem de sessões do dia, a contagem de sessões realizadas e o valor total a receber
exibidos correspondem aos dados reais da usuária.

**Acceptance Scenarios**:

1. **Given** a usuária está autenticada e tem sessões marcadas para hoje, **When** ela
   abre a tela de Início, **Then** vê seu primeiro nome na saudação, a data de hoje, e
   o número total de sessões de hoje.
2. **Given** a usuária tem pagamentos em aberto, **When** a tela de Início carrega,
   **Then** o valor total a receber aparece oculto (mascarado) por padrão, com um
   controle para revelá-lo; ao tocar no card de pendências financeiras, a usuária é
   levada à tela financeira filtrada por pendências.
3. **Given** a usuária não tem nenhuma sessão marcada para hoje, **When** ela abre a
   tela de Início, **Then** vê uma mensagem indicando que não há mais sessões
   agendadas para o dia, em vez de um card de próxima sessão vazio ou quebrado.

---

### User Story 2 - Agir rapidamente sobre a próxima sessão (Priority: P1)

Uma psicóloga com sessões marcadas para hoje vê em destaque a próxima sessão (horário,
paciente, modalidade, duração e valor) e pode, a partir dali, abrir a ficha do paciente
ou registrar a sessão sem precisar navegar até a agenda.

**Why this priority**: Antecipar a próxima sessão é a ação mais frequente e de maior
valor no dia a dia da psicóloga; atalhos diretos evitam navegação desnecessária antes e
depois de cada atendimento.

**Independent Test**: Pode ser testado isoladamente criando uma sessão confirmada ou
pendente para hoje, abrindo a tela de Início, e confirmando que os botões "Abrir ficha"
e "Registrar" levam, respectivamente, à ficha do paciente correto e à tela de registro
daquela sessão.

**Acceptance Scenarios**:

1. **Given** existe uma sessão confirmada ou pendente mais próxima no horário atual,
   **When** a tela de Início carrega, **Then** o destaque de próxima sessão mostra o
   horário, nome do paciente, modalidade e duração dessa sessão, com o valor oculto
   (mascarado) por padrão e um controle para revelá-lo.
2. **Given** o destaque de próxima sessão está visível, **When** a usuária toca em
   "Abrir ficha", **Then** ela é levada à ficha do paciente correspondente.
3. **Given** o destaque de próxima sessão está visível, **When** a usuária toca em
   "Registrar", **Then** ela é levada à tela de registro daquela sessão específica.

---

### User Story 3 - Resolver pendências do dia sem sair da tela de Início (Priority: P2)

Uma psicóloga vê, em uma seção de pendências, as sessões de hoje que ainda não foram
confirmadas pelo paciente e um aviso de pagamentos em aberto, podendo confirmar uma
sessão diretamente dali.

**Why this priority**: Reduz a necessidade de ir até a agenda ou ao financeiro só para
resolver pendências simples e recorrentes, tornando o fluxo diário mais eficiente.

**Independent Test**: Pode ser testado isoladamente criando uma sessão de hoje com
status pendente e confirmando que ela aparece na seção de pendências com um botão de
"Confirmar" que, ao ser tocado, atualiza o status da sessão e exibe uma confirmação
visual da ação.

**Acceptance Scenarios**:

1. **Given** há sessões de hoje ainda não confirmadas pelo paciente, **When** a tela de
   Início carrega, **Then** cada uma aparece na seção de pendências com nome do
   paciente e horário.
2. **Given** uma sessão pendente aparece na seção de pendências, **When** a usuária
   toca em "Confirmar", **Then** a sessão passa a status confirmado e a usuária recebe
   uma confirmação visual da ação.
3. **Given** não há sessões pendentes de confirmação nem pagamentos em aberto, **When**
   a tela de Início carrega, **Then** a seção de pendências indica que tudo está em dia,
   em vez de aparecer vazia.

---

### Edge Cases

- O que acontece quando a usuária não tem nenhuma sessão, nenhum pagamento pendente e
  nenhuma pendência no dia (primeiro uso do app ou dia totalmente livre)? A tela deve
  comunicar claramente esse estado "vazio" em cada seção, em vez de parecer quebrada ou
  carregando infinitamente.
- O que acontece quando a usuária abre a tela de Início sem conexão com a internet? A
  tela DEVE bloquear o acesso ao conteúdo e exibir uma mensagem de erro informando que é
  necessário estar conectado, em vez de mostrar dados desatualizados ou uma tela em
  branco.
- Como o sistema lida com mais de uma sessão pendente/confirmada no mesmo horário ao
  decidir qual é a "próxima sessão" em destaque?
- O que acontece se a usuária permanecer na tela de Início enquanto o dia muda de data
  (ex.: app aberto durante a virada da meia-noite)? O resumo deve refletir o novo dia
  atual, não o dia em que a tela foi originalmente carregada.
- Como a tela se comporta quando o nome da usuária não está disponível (ex.: conta
  recém-criada sem nome preenchido)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir, ao abrir a tela de Início, uma saudação
  personalizada contendo o primeiro nome da usuária autenticada e a data atual.
- **FR-002**: O sistema DEVE exibir o número total de sessões marcadas para o dia
  atual e quantas delas já foram realizadas.
- **FR-003**: O sistema DEVE exibir o valor total a receber em pagamentos pendentes de
  forma oculta (mascarada) por padrão, com um controle para a usuária revelá-lo e
  ocultá-lo novamente a qualquer momento (sem ocultação automática por tempo), e
  permitir que ela toque no card de pendências financeiras para ir à tela financeira já
  filtrada por pendências.
- **FR-004**: O sistema DEVE destacar a próxima sessão do dia (a mais próxima no
  horário atual entre as sessões confirmadas ou pendentes), mostrando horário,
  paciente, modalidade e duração; o valor da sessão DEVE ser exibido oculto
  (mascarado) por padrão, com um controle para revelá-lo e ocultá-lo novamente a
  qualquer momento (sem ocultação automática por tempo).
- **FR-016**: Toda vez que a tela de Início for aberta (nova visita à tela ou novo
  início do app), os valores financeiros DEVEM começar ocultos (mascarados) por
  padrão, independentemente de terem sido revelados em uma abertura anterior.
- **FR-005**: Quando não houver próxima sessão no dia, o sistema DEVE exibir uma
  mensagem indicando que a agenda do dia está concluída, no lugar do destaque de
  próxima sessão.
- **FR-006**: A partir do destaque de próxima sessão, o sistema DEVE permitir abrir a
  ficha do paciente correspondente e permitir registrar essa sessão específica.
- **FR-007**: O sistema DEVE listar as sessões do dia atual em uma seção própria,
  permitindo abrir a ficha do paciente de cada sessão listada.
- **FR-008**: O sistema DEVE fornecer um atalho para a tela de agenda completa a partir
  da seção de sessões do dia.
- **FR-009**: O sistema DEVE listar, em uma seção de pendências, as sessões de hoje
  ainda não confirmadas pelo paciente, permitindo confirmar cada uma diretamente
  nessa tela.
- **FR-010**: Quando houver pagamentos em aberto, o sistema DEVE exibir um resumo de
  pendências financeiras na seção de pendências, com atalho para a tela financeira
  filtrada por pendências.
- **FR-011**: Quando não houver nenhuma pendência (nem sessões não confirmadas, nem
  pagamentos em aberto), o sistema DEVE indicar visualmente que tudo está em dia.
- **FR-012**: O sistema DEVE permitir que a usuária saia da conta (logout) a partir da
  tela de Início, com confirmação visual de que a sessão foi encerrada.
- **FR-013**: Ao confirmar uma sessão pendente a partir da tela de Início, o sistema
  DEVE atualizar imediatamente o status exibido dessa sessão e refletir a mudança nas
  contagens e seções afetadas (ex.: seção de pendências).
- **FR-014**: Quando não houver conexão com a internet, o sistema DEVE bloquear o
  acesso ao conteúdo da tela de Início e exibir uma mensagem de erro informando que é
  necessário estar conectado, em vez de exibir dados desatualizados.
- **FR-015**: Enquanto a tela de Início permanecer aberta, o sistema DEVE atualizar
  automaticamente o destaque de próxima sessão quando o horário da sessão atualmente
  destacada passar, sem exigir que a usuária saia e volte à tela.

### Key Entities *(include if feature involves data)*

- **Usuária (Psicóloga)**: Profissional autenticada cujo nome e identidade orientam a
  saudação e o acesso aos próprios dados.
- **Sessão**: Atendimento agendado com data, horário, duração, modalidade, valor,
  paciente vinculado e status (pendente, confirmada, realizada).
- **Paciente**: Pessoa atendida, vinculada a sessões, identificada por nome e ficha
  própria.
- **Lançamento Financeiro**: Registro de pagamento vinculado a sessões/pacientes, com
  valor e indicação de pago ou pendente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuárias conseguem identificar quantas sessões têm hoje e qual é a
  próxima em até 3 segundos após abrir o app.
- **SC-002**: 95% das ações de "abrir ficha" ou "registrar" a partir da próxima sessão
  levam a usuária à tela correta sem erros de navegação.
- **SC-003**: Usuárias conseguem confirmar uma sessão pendente do dia sem sair da tela
  de Início em 100% dos casos em que a pendência está listada.
- **SC-004**: Em telas sem nenhum dado do dia (sem sessões, sem pendências), 100% das
  seções exibem uma mensagem de estado vazio compreensível, nunca uma área em branco
  ou travada.

## Assumptions

- A tela de Início é exibida apenas para usuárias já autenticadas; o fluxo de login,
  cadastro e recuperação de senha está fora do escopo desta especificação (coberto pela
  especificação de autenticação já existente).
- "Hoje" é definido pela data/hora do dispositivo da usuária.
- Sessões, pacientes e lançamentos financeiros já existem como conceitos no sistema
  (criados e geridos por outras funcionalidades); esta especificação cobre apenas como
  a tela de Início os resume e expõe atalhos para eles, não sua criação ou edição.
- Quando há múltiplas sessões no mesmo horário elegíveis a "próxima sessão", o sistema
  escolhe uma delas de forma consistente (ex.: a primeira cadastrada), sem exigir que a
  usuária escolha manualmente.
- A navegação entre abas (Início, Agenda, Pacientes, Financeiro) e a estrutura de
  autenticação já estabelecidas no app permanecem inalteradas por esta funcionalidade.
