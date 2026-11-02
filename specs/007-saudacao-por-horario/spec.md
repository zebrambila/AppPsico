# Feature Specification: Saudação de boas-vindas por horário

**Feature Branch**: `007-saudacao-por-horario`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Especificar a msg de boas vindas de acordo com o horario, pois está sempre aparecendo bom dia"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saudação correta para o momento do dia (Priority: P1)

Ao abrir a tela inicial, a pessoa usuária vê uma saudação que corresponde ao horário local do seu dispositivo: "Bom dia", "Boa tarde" ou "Boa noite", seguida do seu primeiro nome. Hoje a mensagem exibe sempre "Bom dia", o que soa incorreto à tarde e à noite.

**Why this priority**: É o próprio defeito reportado; corrigi-lo entrega todo o valor da funcionalidade.

**Independent Test**: Abrir a tela inicial em diferentes horários do dia (ou simulando o horário do dispositivo) e conferir que a saudação exibida corresponde à faixa de horário.

**Acceptance Scenarios**:

1. **Given** o horário local entre 05:00 e 11:59, **When** a tela inicial é exibida, **Then** a saudação é "Bom dia, {primeiro nome}".
2. **Given** o horário local entre 12:00 e 17:59, **When** a tela inicial é exibida, **Then** a saudação é "Boa tarde, {primeiro nome}".
3. **Given** o horário local entre 18:00 e 04:59, **When** a tela inicial é exibida, **Then** a saudação é "Boa noite, {primeiro nome}".

---

### User Story 2 - Saudação acompanha a passagem do tempo (Priority: P2)

Se a pessoa deixa o app aberto ou volta a ele depois de algum tempo e o período do dia mudou, a saudação se atualiza sem precisar reiniciar o app.

**Why this priority**: Evita que a saudação fique desatualizada em sessões longas, mas o app funciona bem sem isso.

**Independent Test**: Deixar o app aberto na tela inicial atravessando uma fronteira de faixa (ex.: 11:59 → 12:00), ou colocá-lo em segundo plano e retorná-lo após a fronteira, e conferir a nova saudação.

**Acceptance Scenarios**:

1. **Given** a tela inicial aberta às 11:59 com "Bom dia", **When** o relógio passa de 12:00, **Then** a saudação passa a "Boa tarde" sem ação da pessoa.
2. **Given** o app em segundo plano desde a manhã, **When** a pessoa retorna à tarde, **Then** a saudação exibida é "Boa tarde".

---

### Edge Cases

- Exatamente nas fronteiras (05:00, 12:00, 18:00): a nova faixa começa no horário indicado.
- Madrugada (00:00–04:59): tratada como "Boa noite".
- Usuário sem nome disponível: a saudação é exibida sem o nome, mantendo o comportamento atual para esse caso.
- Mudança de fuso horário ou de horário do dispositivo: a saudação reflete o horário local atual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir "Bom dia" quando o horário local do dispositivo estiver entre 05:00 e 11:59.
- **FR-002**: O sistema MUST exibir "Boa tarde" quando o horário local estiver entre 12:00 e 17:59.
- **FR-003**: O sistema MUST exibir "Boa noite" quando o horário local estiver entre 18:00 e 04:59.
- **FR-004**: A saudação MUST continuar seguida do primeiro nome da pessoa usuária, como já ocorre hoje.
- **FR-005**: A saudação MUST se atualizar quando o período do dia mudar enquanto o app está aberto ou ao retornar do segundo plano.
- **FR-006**: O horário usado MUST ser o horário local do dispositivo, sem depender de conexão com a internet.

### Key Entities *(include if feature involves data)*

- **Faixa do dia**: Período (manhã, tarde, noite) definido por intervalo de horário local, que determina o texto da saudação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das aberturas da tela inicial, a saudação corresponde à faixa do horário local (verificado em pelo menos um horário de cada faixa e nas três fronteiras).
- **SC-002**: A saudação deixa de exibir "Bom dia" fora do intervalo 05:00–11:59.
- **SC-003**: Após cruzar uma fronteira de faixa, a saudação correta é exibida em até 10 minutos com o app aberto, ou imediatamente ao retornar do segundo plano.

## Assumptions

- As faixas são: manhã 05:00–11:59, tarde 12:00–17:59, noite 18:00–04:59 (convenção comum no Brasil).
- O texto permanece em português do Brasil; não há internacionalização nesta entrega.
- A mudança afeta apenas a saudação da tela inicial; outras telas não possuem saudação por horário.
- O primeiro nome do usuário já é obtido pela lógica existente da tela inicial.
