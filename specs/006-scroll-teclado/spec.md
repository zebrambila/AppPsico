# Feature Specification: Scroll Automático com Teclado

**Feature Branch**: `006-scroll-teclado`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Implementar o scroll na telas do aplicativo quando o teclado for acionado, pois os campos inferiores estão ficando encobertos pelo teclado"

## Clarifications

### Session 2026-10-30

- Q: As telas de lista que têm apenas um campo de busca/filtro no topo (ex.: a busca por nome na tela de Pacientes) devem ser incluídas no escopo desta funcionalidade, mesmo não tendo o problema de "campo inferior encoberto" relatado? → A: Excluir campos de busca no topo — o escopo fica restrito aos formulários reais (cadastro/edição de paciente, registro/edição de sessão, login/criação de conta) onde campos podem ficar atrás do teclado.
- Q: Fechar o teclado automaticamente ao tocar fora de qualquer campo (FR-004) deve continuar fazendo parte do escopo, mesmo não tendo sido pedido explicitamente? → A: Manter no escopo — é um complemento de baixo risco que melhora a usabilidade geral dos formulários junto com o ajuste de scroll.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preencher formulário longo sem perder campos (Priority: P1)

Como usuária preenchendo um formulário com vários campos (ex.: cadastro/edição de paciente, registro de sessão), quando toco em um campo próximo ao final da tela e o teclado aparece, a tela rola automaticamente para que o campo tocado permaneça visível acima do teclado, em vez de ficar escondido atrás dele.

**Why this priority**: É o problema relatado diretamente pelo usuário — campos inferiores ficam encobertos, impedindo a conclusão do preenchimento. Sem isso, o fluxo de cadastro/edição é bloqueado ou frustrante.

**Independent Test**: Abrir uma tela com formulário (ex.: cadastro de paciente ou registro de sessão), tocar em um campo de texto localizado na parte inferior da tela e verificar que o campo e seu label permanecem visíveis e acessíveis com o teclado aberto.

**Acceptance Scenarios**:

1. **Given** uma tela de formulário com campos abaixo da área visível quando o teclado está fechado, **When** o usuário toca em um campo de texto na parte inferior, **Then** a tela rola automaticamente até que o campo tocado fique visível acima do teclado, sem ficar colado na borda superior do teclado.
2. **Given** o teclado está aberto e cobrindo parte da tela, **When** o usuário navega entre campos (ex.: via "próximo" do teclado ou tocando em outro campo), **Then** a tela ajusta o scroll para manter o novo campo focado visível.
3. **Given** o teclado está aberto, **When** o usuário toca fora de qualquer campo de texto (em área neutra da tela), **Then** o teclado se fecha e a tela retorna a um estado de scroll normal.

---

### User Story 2 - Botões de ação (salvar/confirmar) sempre acessíveis (Priority: P2)

Como usuária preenchendo um formulário, quando o teclado está aberto, consigo rolar a tela até o botão de ação final (ex.: "Salvar", "Confirmar") e tocar nele sem precisar fechar o teclado manualmente primeiro.

**Why this priority**: Complementa a história principal garantindo que a ação de conclusão do formulário não fique inacessível, mesmo que o botão não seja o campo focado no momento.

**Independent Test**: Em uma tela de formulário, abrir o teclado em um campo intermediário, rolar manualmente a tela até o botão de ação na parte inferior e confirmar que o botão está visível e clicável.

**Acceptance Scenarios**:

1. **Given** o teclado está aberto e o botão de ação final está abaixo da área visível, **When** o usuário rola a tela manualmente, **Then** o botão de ação torna-se visível e permanece utilizável (não fica sob o teclado).

---

### User Story 3 - Comportamento consistente entre plataformas (Priority: P3)

Como usuária do aplicativo tanto em iOS quanto em Android, espero que o comportamento de ajuste de scroll ao abrir o teclado seja consistente e não apresente saltos abruptos, sobreposições ou áreas em branco excessivas.

**Why this priority**: Garante qualidade e consistência da experiência, mas é refinamento sobre o comportamento funcional já coberto pelas histórias P1 e P2.

**Independent Test**: Repetir os testes da User Story 1 em um dispositivo/simulador iOS e em um dispositivo/emulador Android, comparando se o campo focado fica visível em ambos sem comportamento visualmente quebrado.

**Acceptance Scenarios**:

1. **Given** a mesma tela de formulário, **When** testada em iOS e em Android, **Then** em ambas as plataformas o campo focado permanece visível acima do teclado, sem sobreposição e sem espaço em branco excessivo entre o conteúdo e o teclado.

---

### Edge Cases

- O que acontece quando o campo focado já está totalmente visível (próximo ao topo da tela) e o teclado abre? O scroll não deve se mover desnecessariamente.
- O que acontece em telas com pouco conteúdo, onde todos os campos cabem na tela mesmo com o teclado aberto? Não deve haver scroll vazio nem espaço em branco extra abaixo do último campo.
- O que acontece ao girar o dispositivo (orientação) ou ao redimensionar a tela (ex.: modo split-screen em tablets Android) enquanto o teclado está aberto? O campo focado deve permanecer visível após o reajuste.
- O que acontece quando o usuário abre o teclado numérico ou outro tipo de teclado com altura diferente do teclado padrão? O ajuste de scroll deve considerar a altura real do teclado exibido.
- O que acontece em campos de texto multilinha (ex.: observações/anotações) que crescem em altura conforme o usuário digita? O scroll deve se ajustar conforme o campo cresce para manter a linha de edição visível.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE detectar a abertura e o fechamento do teclado em todas as telas do aplicativo que contenham campos de entrada de texto.
- **FR-002**: Quando o teclado abre e o campo em foco fica (ou ficaria) oculto atrás do teclado, o sistema DEVE rolar automaticamente o conteúdo da tela para que o campo em foco fique visível, com uma margem de respiro acima do teclado.
- **FR-003**: O sistema DEVE permitir que o usuário role manualmente o conteúdo da tela enquanto o teclado está aberto, para acessar campos ou botões de ação que não estejam na área inicialmente visível.
- **FR-004**: O sistema DEVE fechar o teclado quando o usuário tocar em uma área da tela que não seja um campo de entrada de texto nem um controle interativo.
- **FR-005**: O sistema NÃO DEVE introduzir espaço em branco permanente abaixo do conteúdo quando o teclado estiver fechado.
- **FR-006**: O ajuste de scroll DEVE funcionar de forma consistente nas plataformas iOS e Android suportadas pelo aplicativo.
- **FR-007**: Ao alternar o foco entre campos (ex.: usando o botão "próximo" do teclado ou tocando diretamente em outro campo), o sistema DEVE reajustar o scroll para manter o novo campo em foco visível.
- **FR-008**: O comportamento de scroll com teclado DEVE ser aplicado a todas as telas do aplicativo que possuam formulários com múltiplos campos de entrada, incluindo (mas não se limitando a) telas de login, criação de conta, cadastro/edição de pacientes e registro/edição de sessões.
- **FR-009**: Telas que contenham apenas um campo de busca/filtro isolado (sem outros campos de formulário abaixo dele), como a busca por nome na lista de pacientes, estão fora do escopo desta funcionalidade, pois esse tipo de campo não fica oculto atrás do teclado.

### Key Entities

Não aplicável — esta funcionalidade é puramente de comportamento de interface, não introduz nem modifica entidades de dados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das telas do aplicativo com formulários de múltiplos campos (fora do escopo de exclusão definido em FR-009), nenhum campo em foco permanece visualmente oculto atrás do teclado.
- **SC-002**: Usuários conseguem preencher e enviar qualquer formulário do aplicativo (ex.: cadastro de paciente, registro de sessão) do início ao fim sem precisar fechar o teclado manualmente para ver o campo que estão editando.
- **SC-003**: Em testes manuais em iOS e Android, o ajuste de scroll ocorre de forma perceptível como imediata (sem atraso perceptível pelo usuário) ao focar um campo coberto pelo teclado.
- **SC-004**: Não há relatos de "espaço em branco" ou "salto de tela" indesejado em telas com poucos campos após a implementação.

## Assumptions

- O aplicativo possui múltiplas telas com formulários (ex.: login, criação de conta, cadastro/edição de paciente, registro/edição de sessão) que devem receber o mesmo comportamento de ajuste de scroll.
- "Margem de respiro acima do teclado" significa um pequeno espaçamento (padrão de mercado, não pixel-perfect especificado pelo usuário) entre o campo em foco e a borda superior do teclado, apenas o suficiente para leitura confortável do campo.
- O comportamento deve respeitar áreas seguras do dispositivo (notch, barra de gestos) já tratadas pelo aplicativo, sem introduzir regressões nessas áreas.
- Campos de entrada incluem campos de texto simples, numéricos e multilinha (texto longo/observações).
- Esta funcionalidade é de experiência de interface; não requer alterações em regras de negócio, validação de dados ou persistência.
