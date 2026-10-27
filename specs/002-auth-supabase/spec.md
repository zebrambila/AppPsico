# Feature Specification: Login, Criar Conta e Recuperação de Senha com Contas Persistentes

**Feature Branch**: `002-auth-supabase`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Especificar a tela de login, acrescentando a historia de
criar conta, esqueci minha senha. Os usuarios (psicologos que utilizarão sistema) serão
armazenados em um banco de dados supabase"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar com conta cadastrada (Priority: P1)

Uma psicóloga que já tem conta criada abre o app, informa e-mail e senha, e é levada à
área principal (Início/Agenda/Pacientes/Financeiro). Suas credenciais são verificadas
contra a conta real dela, previamente salva de forma persistente — não mais uma
simulação em memória que aceita qualquer e-mail.

**Why this priority**: É o caminho de entrada no app para quem já é usuária; sem ele,
nenhuma outra funcionalidade é alcançável. Ao se tornar uma verificação real de
credenciais persistentes, este também passa a ser o requisito que torna o app seguro
para uso com dados reais de pacientes.

**Independent Test**: Pode ser testado isoladamente criando uma conta, saindo do app
(ou reiniciando), voltando à tela de login, informando e-mail e senha corretos, e
confirmando acesso à área principal; e separadamente, informando uma senha errada e
confirmando que o acesso é negado com uma mensagem de erro.

**Acceptance Scenarios**:

1. **Given** uma conta já criada com e-mail e senha conhecidos, **When** a usuária
   informa essas credenciais corretas na tela de login, **Then** o app concede acesso à
   área principal.
2. **Given** uma conta já criada, **When** a usuária informa o e-mail correto mas uma
   senha errada, **Then** o acesso é negado e uma mensagem de erro é exibida, sem
   indicar se o problema foi o e-mail ou a senha.
3. **Given** nenhuma conta cadastrada com o e-mail informado, **When** a usuária tenta
   entrar com esse e-mail, **Then** o acesso é negado com a mesma mensagem de erro
   genérica usada para senha incorreta (para não revelar quais e-mails têm conta).

---

### User Story 2 - Criar conta (Priority: P1)

Uma psicóloga que ainda não tem conta se cadastra informando nome, e-mail, senha
(com confirmação) e, opcionalmente, CRP e celular, aceita os termos de uso e a
política de privacidade, e passa a ter uma conta real e persistente que pode ser usada
para entrar no app a partir de qualquer momento futuro — inclusive após reinstalar o
app ou trocar de aparelho.

**Why this priority**: Sem cadastro real, não existem contas para autenticar de forma
persistente — é o par inseparável do login nesta funcionalidade, e ambos são
necessários para que o produto deixe de depender da conta de demonstração em memória.

**Independent Test**: Pode ser testado isoladamente preenchendo o formulário de
cadastro com dados válidos, confirmando a criação da conta, e depois conseguindo entrar
com essas credenciais em uma sessão separada (ex.: após reiniciar o app).

**Acceptance Scenarios**:

1. **Given** a tela de criar conta, **When** a usuária preenche nome, e-mail não
   usado anteriormente, senha com no mínimo 8 caracteres, confirmação de senha idêntica,
   e aceita os termos, **Then** a conta é criada de forma persistente e a usuária
   obtém acesso à área principal.
2. **Given** a tela de criar conta, **When** a usuária informa um e-mail que já possui
   conta cadastrada, **Then** o cadastro é rejeitado com uma mensagem informando que o
   e-mail já está em uso.
3. **Given** a tela de criar conta, **When** a senha e a confirmação de senha não
   coincidem, ou a senha tem menos de 8 caracteres, ou os termos não foram aceitos,
   **Then** o cadastro é bloqueado e mensagens de erro específicas são exibidas para
   cada campo problemático, sem enviar nenhuma informação ao armazenamento de contas.

---

### User Story 3 - Recuperar senha esquecida (Priority: P2)

Uma psicóloga que esqueceu sua senha solicita a recuperação informando seu e-mail,
recebe instruções para definir uma nova senha, e consegue voltar a entrar no app com a
nova senha, sem precisar de ajuda manual de suporte.

**Why this priority**: É essencial para reter uma usuária que esqueceu a senha de uma
conta agora persistente (diferente da versão anterior, em que a recuperação só emitia
uma mensagem de confirmação sem efeito real), mas o app continua utilizável sem este
fluxo caso a usuária ainda lembre a senha ou crie uma nova conta.

**Independent Test**: Pode ser testado isoladamente solicitando a recuperação de senha
para uma conta existente, completando as instruções recebidas para definir uma nova
senha, e confirmando que a conta passa a aceitar somente a nova senha no login (a senha
antiga deixa de funcionar).

**Acceptance Scenarios**:

1. **Given** a tela de login, **When** a usuária toca em "Esqueci minha senha" e
   informa o e-mail de uma conta existente, **Then** o sistema envia um link de
   redefinição para esse e-mail e confirma o envio na tela.
2. **Given** um link de redefinição recebido por e-mail, **When** a usuária toca nesse
   link, **Then** o app abre diretamente em uma tela de "definir nova senha", onde ela
   informa e confirma a nova senha sem precisar passar por uma página web externa.
3. **Given** a tela de "definir nova senha" aberta a partir do link, **When** a usuária
   confirma uma nova senha válida, **Then** a conta passa a aceitar a nova senha e a
   senha anterior deixa de funcionar.
4. **Given** a tela de "esqueci minha senha", **When** a usuária informa um e-mail sem
   conta cadastrada, **Then** o sistema confirma o envio das instruções da mesma forma
   que confirmaria para um e-mail válido (para não revelar quais e-mails têm conta).

---

### User Story 4 - Validação de campos antes do envio (Priority: P3)

Em qualquer uma das telas (entrar, criar conta, recuperar senha), ao preencher um campo
de forma inválida, a usuária vê mensagens de erro específicas junto ao campo, antes de
qualquer tentativa ser enviada ao armazenamento de contas.

**Why this priority**: Reduz tentativas desnecessárias de comunicação com o
armazenamento de contas e dá feedback imediato; é uma melhoria de qualidade sobre as
três histórias anteriores, que já funcionam sem ela, só com pior experiência.

**Independent Test**: Pode ser testado isoladamente preenchendo cada formulário com
valores inválidos (e-mail malformado, senha curta, confirmação divergente, termos não
aceitos) e confirmando que aparecem mensagens de erro específicas e nenhuma tentativa é
enviada.

**Acceptance Scenarios**:

1. **Given** qualquer um dos três formulários, **When** a usuária informa um e-mail em
   formato inválido e tenta enviar, **Then** o campo de e-mail exibe "Informe um e-mail
   válido." e nenhuma tentativa é enviada.
2. **Given** a tela de criar conta, **When** a senha tem menos de 8 caracteres, ou a
   confirmação não coincide com a senha, ou os termos não foram marcados, **Then** cada
   campo problemático exibe sua mensagem de erro específica e o cadastro não é enviado.

---

### Edge Cases

- O que acontece se a usuária perder a conexão com a internet durante o login, cadastro
  ou solicitação de recuperação de senha? O sistema MUST exibir uma mensagem de erro
  indicando falha de comunicação (distinta da mensagem de credenciais inválidas) e
  preservar o conteúdo já digitado para nova tentativa.
- O que acontece se a usuária tentar criar uma conta com um e-mail que já existe,
  enquanto digita (antes de enviar)? Não há validação obrigatória em tempo real;
  a duplicidade é verificada apenas no envio do cadastro (ver User Story 2).
- O que acontece se a usuária tocar em "Entrar" ou "Criar conta" múltiplas vezes
  rapidamente enquanto uma tentativa já está em andamento? O botão entra em estado de
  carregamento e novas tentativas não são disparadas até a atual terminar.
- O que acontece se o link/instrução de redefinição de senha for usado mais de uma vez,
  ou depois de expirado? A segunda tentativa (ou tentativa expirada) MUST ser rejeitada
  com uma mensagem clara, orientando a usuária a solicitar uma nova recuperação.
- O que acontece com sessões já autenticadas quando a senha da conta é alterada via
  recuperação de senha? Está fora do escopo desta especificação definir se sessões
  antigas em outros dispositivos são revogadas automaticamente (ver Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que uma psicóloga crie uma conta informando, no
  mínimo, nome, e-mail e senha, com CRP e celular permanecendo opcionais como hoje.
- **FR-002**: O sistema MUST impedir a criação de mais de uma conta com o mesmo e-mail,
  informando à usuária que o e-mail já está em uso.
- **FR-003**: O sistema MUST armazenar as contas de forma persistente, de modo que uma
  conta criada continue válida para login em qualquer sessão futura do app, incluindo
  após reiniciar o app, trocar de aparelho, ou reinstalar o app.
- **FR-004**: O sistema MUST verificar e-mail e senha informados no login contra os
  dados reais da conta armazenada, negando acesso quando não corresponderem, com uma
  mensagem de erro genérica que não revela se o e-mail existe ou não.
- **FR-005**: O sistema MUST validar, antes de qualquer envio, que: o e-mail está em
  formato válido; a senha de login não está vazia; e, no cadastro, a senha tem ao menos
  8 caracteres, a confirmação de senha coincide com a senha, e os termos de uso/
  privacidade foram aceitos — exibindo mensagens de erro específicas por campo quando a
  validação falhar.
- **FR-006**: O sistema MUST permitir que a usuária solicite recuperação de senha
  informando seu e-mail, e MUST confirmar o envio das instruções de redefinição de
  forma idêntica tanto para e-mails com conta quanto sem conta cadastrada.
- **FR-007**: O sistema MUST permitir que a usuária, após seguir as instruções de
  recuperação, defina uma nova senha que substitui a anterior; a senha anterior deixa
  de ser aceita para login a partir dessa redefinição.
- **FR-008**: O sistema MUST rejeitar o uso repetido ou expirado de uma mesma
  instrução/link de redefinição de senha, informando a usuária que deve solicitar uma
  nova recuperação.
- **FR-009**: O sistema MUST indicar visualmente quando uma tentativa de login,
  cadastro ou recuperação de senha está em andamento, e impedir o disparo de uma nova
  tentativa enquanto a atual não terminar.
- **FR-010**: O sistema MUST permitir que a usuária alterne a visibilidade do texto
  digitado nos campos de senha (mostrar/ocultar) em todas as telas que possuem campo de
  senha.
- **FR-011**: Ao autenticar com sucesso (login ou após criar conta), o sistema MUST
  conceder acesso à área principal do app e impedir a navegação de volta para as telas
  de login/cadastro/recuperação enquanto a sessão estiver ativa.
- **FR-012**: O sistema MUST oferecer caminhos de navegação entre as três telas (login
  ↔ criar conta ↔ esqueci minha senha) sem perder, ao alternar, os dados já digitados
  na tela de origem até a usuária voltar a ela.
- **FR-013**: O sistema MUST conceder acesso autenticado imediatamente após o cadastro
  bem-sucedido, sem exigir uma etapa prévia de confirmação de e-mail por link.
- **FR-014**: O campo CRP no cadastro MUST continuar sendo opcional e de texto livre,
  sem verificação contra nenhum registro oficial do Conselho Regional de Psicologia.
- **FR-015**: Ao seguir o link de recuperação de senha, o sistema MUST abrir, dentro do
  próprio app, uma tela de "definir nova senha" onde a usuária informa e confirma a
  nova senha sem precisar concluir essa etapa em uma página web externa.

### Key Entities

- **Conta de usuária (psicóloga)**: representa a profissional que usa o sistema;
  atributos relevantes a esta especificação são nome, e-mail (identificador único de
  login), senha (armazenada de forma seria, nunca em texto puro), CRP (opcional), e
  celular (opcional). Passa a ser armazenada de forma persistente e centralizada, em
  vez de apenas em memória durante a sessão do app.
- **Solicitação de redefinição de senha**: representa um pedido de recuperação de
  senha em andamento para uma conta; relevante apenas pelo seu estado (pendente,
  usada, expirada) e pela conta de e-mail à qual se refere.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma conta criada em uma sessão do app continua válida para login em
  100% das tentativas feitas em sessões futuras, incluindo após reiniciar o app.
- **SC-002**: Uma usuária com conta válida consegue entrar na área principal em menos
  de 15 segundos a partir da abertura da tela de login, em uma tentativa sem erros.
- **SC-003**: Uma usuária consegue criar uma conta nova e obter acesso à área principal
  em menos de 2 minutos, em uma tentativa sem erros de preenchimento.
- **SC-004**: 100% das tentativas de login, cadastro ou recuperação de senha com dados
  inválidos (formato de e-mail, senha curta, confirmação divergente, termos não
  aceitos, e-mail duplicado) são bloqueadas com uma mensagem de erro específica e
  compreensível, sem necessidade de suporte externo para entender o problema.
- **SC-005**: Uma usuária que esqueceu a senha consegue voltar a acessar sua conta
  seguindo apenas o fluxo de recuperação dentro do app e as instruções recebidas, sem
  precisar de intervenção manual de suporte.
- **SC-006**: Nenhuma mensagem de erro em login ou recuperação de senha revela se um
  e-mail específico possui ou não conta cadastrada.

## Assumptions

- Esta especificação amplia e substitui, para efeitos de persistência de contas, o
  comportamento descrito em `001-login-screen` (que documentava a tela de login com
  autenticação simulada em memória). Criar conta e recuperar senha, antes fora do
  escopo ou tratadas apenas como confirmação sem efeito real, passam a ter efeito real
  de armazenamento aqui.
- O armazenamento de contas é um serviço externo de backend (provedor de banco de
  dados/autenticação) indicado pela stakeholder como Supabase; esta especificação
  descreve o comportamento observável para a usuária, não como esse armazenamento é
  implementado — mas registra Supabase como dependência de negócio já decidida, não
  como uma opção técnica a ser escolhida na fase de planejamento.
- Cada conta tem acesso apenas aos próprios dados (pacientes, agenda, financeiro,
  prontuário); isolamento de dados entre contas diferentes é tratado como um requisito
  do sistema como um todo (ver Princípio III da constituição do projeto — privacidade
  de dados de pacientes/LGPD), não desta tela especificamente, mas é uma condição
  implícita para que o armazenamento persistente de contas seja seguro.
- Autenticação continua sendo apenas por e-mail e senha; login social (Google, Apple
  etc.) e autenticação multifator permanecem fora do escopo desta especificação.
- Não há, nesta especificação, um limite explícito de tentativas de login nem bloqueio
  temporário de conta após tentativas repetidas com senha errada; assume-se que
  proteções padrão contra força bruta, tipicamente já oferecidas por um provedor de
  autenticação como o indicado, são suficientes nesta fase.
- A sessão de uma usuária autenticada permanece válida entre reaberturas do app
  (login persistente), seguindo o padrão comum de apps mobile com conta real, até que
  a usuária toque explicitamente em sair (logout) — a usuária não precisa reinformar
  e-mail e senha a cada abertura do app.
