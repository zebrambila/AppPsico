# Feature Specification: Tela de Login

**Feature Branch**: `001-login-screen`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Especificar a tela de login"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar com e-mail e senha (Priority: P1)

Uma psicóloga que já tem conta abre o app, informa e-mail e senha cadastrados, e é
levada à área principal (Início/Agenda/Pacientes/Financeiro), sem acesso de volta às
telas de login/cadastro enquanto estiver autenticada.

**Why this priority**: É o único caminho de entrada no app — sem login funcionando,
nenhuma outra funcionalidade (agenda, pacientes, financeiro, prontuário) é alcançável.
É o requisito mínimo para qualquer uso do produto.

**Independent Test**: Pode ser testado isoladamente abrindo o app sem sessão ativa,
informando e-mail e senha de uma conta válida, e verificando que a navegação muda para
a área principal (abas) e que as rotas de login/cadastro deixam de estar acessíveis.

**Acceptance Scenarios**:

1. **Given** o app aberto sem sessão ativa, **When** a usuária informa um e-mail
   cadastrado e a senha correspondente e confirma o login, **Then** o app a leva para a
   tela Início (área autenticada).
2. **Given** a usuária já autenticada, **When** ela tenta navegar manualmente para a
   tela de login ou cadastro, **Then** o app não exibe essas telas (ela permanece na
   área autenticada).

---

### User Story 2 - Validação de e-mail e senha antes do envio (Priority: P2)

Ao tentar entrar com e-mail em formato inválido ou com o campo de senha vazio, a
usuária vê mensagens de erro específicas junto a cada campo, antes de qualquer
tentativa de autenticação ser enviada.

**Why this priority**: Evita chamadas de autenticação desnecessárias e dá à usuária
feedback imediato e claro sobre o que precisa corrigir, reduzindo frustração e
tentativas repetidas sem explicação.

**Independent Test**: Pode ser testado isoladamente preenchendo o campo de e-mail com
um valor sem "@" ou domínio, deixando a senha vazia, e tocando em "Entrar"; o teste
passa se aparecem mensagens de erro nos dois campos e nenhuma tentativa de login é
disparada.

**Acceptance Scenarios**:

1. **Given** a tela de login, **When** a usuária informa um e-mail sem formato válido
   (ex.: sem "@") e toca em "Entrar", **Then** o campo de e-mail exibe a mensagem
   "Informe um e-mail válido." e nenhuma tentativa de autenticação é feita.
2. **Given** a tela de login, **When** a usuária deixa o campo de senha vazio e toca
   em "Entrar", **Then** o campo de senha exibe a mensagem "Informe sua senha." e
   nenhuma tentativa de autenticação é feita.
3. **Given** os campos com erro exibido, **When** a usuária corrige o valor e toca em
   "Entrar" novamente, **Then** a mensagem de erro do campo corrigido desaparece e a
   tentativa de autenticação é feita.

---

### User Story 3 - Visualizar a senha digitada e recuperar senha esquecida (Priority: P3)

A usuária pode alternar a visibilidade da senha digitada para confirmar que a digitou
corretamente, e pode solicitar a recuperação de senha quando não a lembra.

**Why this priority**: São conveniências que reduzem erros de digitação e abandono no
login, mas o login básico (US1) e sua validação (US2) já entregam valor sem elas.

**Independent Test**: Pode ser testado isoladamente digitando uma senha, tocando no
ícone de "mostrar senha" e verificando que o texto fica visível, e tocando em "Esqueci
minha senha" e verificando que uma confirmação de envio é exibida.

**Acceptance Scenarios**:

1. **Given** o campo de senha com texto oculto (padrão), **When** a usuária toca no
   ícone de visibilidade, **Then** a senha digitada passa a ser exibida em texto
   simples, e tocar novamente volta a ocultá-la.
2. **Given** a tela de login, **When** a usuária toca em "Esqueci minha senha",
   **Then** o app confirma que um link de redefinição foi enviado para o e-mail
   informado.

---

### Edge Cases

- O que acontece quando a usuária informa um e-mail válido mas que não corresponde a
  nenhuma conta cadastrada, junto com qualquer senha? O sistema concede acesso tratando
  esse e-mail como uma conta válida (ambiente de demonstração sem verificação real de
  credenciais — ver Assunções); este comportamento MUST ser substituído por rejeição
  real de credenciais inválidas antes de qualquer uso com dados reais de pacientes
  (Princípio III da constituição do projeto).
- Como o sistema trata múltiplos toques rápidos em "Entrar" enquanto uma tentativa já
  está em andamento? O botão exibe estado de carregamento ("Entrando…") e novas
  tentativas não devem ser disparadas até a tentativa atual terminar.
- O que acontece se a tentativa de autenticação falhar por um motivo inesperado (ex.:
  erro de rede, quando uma autenticação real for introduzida)? Uma mensagem de erro
  deve ser exibida à usuária, e os campos preenchidos devem ser preservados para nova
  tentativa.
- O que acontece quando a usuária toca em "Criar conta"? Ela é levada à tela de
  cadastro, saindo do fluxo de login sem perder o que não foi enviado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST apresentar campos de e-mail e senha para a usuária
  informar suas credenciais.
- **FR-002**: O sistema MUST validar, antes de tentar autenticar, que o e-mail está em
  formato válido e que a senha não está vazia, exibindo uma mensagem de erro específica
  junto ao campo inválido quando a validação falhar.
- **FR-003**: O sistema MUST permitir que a usuária alterne a visibilidade do texto da
  senha digitada (mostrar/ocultar).
- **FR-004**: O sistema MUST indicar visualmente quando uma tentativa de autenticação
  está em andamento (ex.: alterar o texto do botão de envio) e impedir o disparo de
  uma nova tentativa enquanto a atual não terminar.
- **FR-005**: Ao autenticar com sucesso, o sistema MUST conceder acesso à área
  principal do app (Início/Agenda/Pacientes/Financeiro) e impedir a navegação de volta
  para as telas de login/cadastro enquanto a sessão estiver ativa.
- **FR-006**: Quando a tentativa de autenticação falhar, o sistema MUST exibir uma
  mensagem de erro para a usuária sem descartar o conteúdo já digitado nos campos.
- **FR-007**: O sistema MUST oferecer um caminho de navegação da tela de login para a
  tela de criação de conta.
- **FR-008**: O sistema MUST oferecer uma ação de "esqueci minha senha" que confirme à
  usuária que uma solicitação de redefinição foi enviada para o e-mail informado.
- **FR-009**: O sistema MUST facilitar o preenchimento de testes/demonstração
  disponibilizando uma conta de demonstração pré-conhecida, sem expor isso como uma
  credencial de produção.

### Key Entities

- **Conta de usuária**: representa a profissional que acessa o app; atributos
  relevantes ao login são e-mail e senha (credenciais) e um indicador de sessão
  ativa/inativa. Não possui, nesta tela, relação direta com dados de pacientes — essa
  relação só existe após a autenticação ser concedida.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma usuária com conta válida consegue entrar na área principal do app em
  menos de 15 segundos a partir da abertura da tela de login, em uma tentativa sem
  erros de digitação.
- **SC-002**: 100% das tentativas de envio com e-mail em formato inválido ou senha
  vazia são bloqueadas antes de qualquer chamada de autenticação, com uma mensagem de
  erro visível e específica para o campo problemático.
- **SC-003**: Em uma tentativa de login malsucedida, a usuária consegue identificar o
  que precisa corrigir e tentar novamente sem precisar redigitar os campos que já
  estavam corretos.
- **SC-004**: A navegação entre "tentar entrar", "mostrar/ocultar senha", "esqueci
  minha senha" e "criar conta" não exige mais de um toque cada para ser iniciada.

## Assumptions

- O mecanismo de autenticação por trás desta tela é, no estado atual do projeto, uma
  simulação em memória (sem verificação real de senha nem persistência entre reinícios
  do app); esta especificação descreve o comportamento observável da tela de login
  independentemente de qual provedor de autenticação está por trás dela, e permanece
  válida quando uma autenticação real for introduzida (ver Princípio III da
  constituição do projeto, que exige substituir essa simulação antes de qualquer uso
  com dados reais de pacientes).
- Autenticação é feita apenas por e-mail e senha; login social (Google, Apple, etc.) e
  autenticação multifator estão fora do escopo desta especificação.
- "Esqueci minha senha" apenas confirma o envio de um link/instrução; o fluxo completo
  de redefinição de senha (tela de nova senha, validação de token) é uma funcionalidade
  separada e não é especificado aqui.
- A tela é usada em português (pt-BR) como idioma único; internacionalização está fora
  do escopo.
- Não há limite de tentativas de login nem bloqueio temporário de conta especificado
  nesta versão; pode ser adicionado como requisito de segurança em uma revisão futura.
