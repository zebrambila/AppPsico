# Research: Scroll Automático com Teclado

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION`. As decisões
abaixo vieram de inspeção direta do código-fonte do app (não de suposições), já que a
causa raiz do problema relatado está nos componentes compartilhados de tela.

## Decisão 1: Reaproveitar o padrão `KeyboardAvoidingView` + `ScrollView` já existente

- **Decision**: Envolver o `ScrollView` de `Screen` (`src/components/ui.tsx`) e o
  `ScrollView` próprio de `src/app/sessao/nova.tsx` em um `KeyboardAvoidingView` com
  `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`, exatamente como já está
  implementado em `src/components/AuthScreen.tsx:11`.
- **Rationale**: Esse padrão já está em produção no app (telas de login/cadastro) e
  funciona sem bibliotecas extras. Reaproveitá-lo satisfaz o Princípio V da
  constituição (sem abstração especulativa) e o Princípio IV (nenhuma API nova incerta
  de SDK — o comportamento já está validado neste mesmo código-base, na mesma versão do
  Expo/React Native).
- **Alternatives considered**:
  - *Biblioteca de terceiros* (ex.: `react-native-keyboard-aware-scroll-view` ou
    `react-native-keyboard-controller`): rejeitada — adicionaria uma dependência nova
    (possivelmente com código nativo, exigindo development build e quebrando a
    compatibilidade com Expo Go) para resolver algo que o próprio React Native já
    resolve, e que o app já demonstra resolver sem ela.
  - *`behavior="height"` no Android*: avaliado e descartado — o padrão já usado em
    `AuthScreen` deixa `behavior` como `undefined` no Android (o comportamento padrão
    do sistema, via `adjustResize` da janela, já funciona); replicar exatamente o que
    já está validado evita introduzir uma variação de comportamento não testada.

## Decisão 2: Remover o `ScrollView` aninhado em `PacienteForm`

- **Decision**: `PacienteForm` (`src/components/PacienteForm.tsx:62`) hoje renderiza seu
  próprio `<ScrollView>` como elemento raiz, mas é sempre usado dentro de `<Screen>`
  (que já é um `ScrollView`). Trocar esse `ScrollView` raiz por um `View` simples com o
  mesmo `style={{ gap: 16 }}`.
- **Rationale**: Dois `ScrollView`s verticais aninhados é um padrão problemático no
  React Native — o gesto de rolagem fica ambíguo entre os dois componentes, e adicionar
  um `KeyboardAvoidingView` por cima não resolve esse conflito, pois o scroll
  automático do teclado precisa agir sobre um único `ScrollView` ancestral (o de
  `Screen`). Achatar para um único `ScrollView` é a correção mínima e torna o
  comportamento de scroll com teclado previsível nas telas de paciente.
- **Alternatives considered**:
  - *Manter os dois `ScrollView`s e tentar sincronizar o scroll entre eles*: rejeitada
    — complexidade desproporcional ao problema; viola o Princípio V.

## Decisão 3: Fechar o teclado ao tocar fora de um campo (FR-004)

- **Decision**: Encapsular o conteúdo rolável de `Screen` e `AuthScreen` em um elemento
  que capture toques em áreas vazias (ex.: `Pressable`/`TouchableWithoutFeedback` com
  `onPress={Keyboard.dismiss}`), mantendo `keyboardShouldPersistTaps="handled"` nos
  `ScrollView`s (já presente) para que toques em campos e botões continuem funcionando
  normalmente sem perder o primeiro toque.
- **Rationale**: É o padrão idiomático do React Native para esse comportamento e não
  exige nenhuma dependência nova; `keyboardShouldPersistTaps="handled"` já garante que
  elementos interativos (inputs, botões, pills) recebem o toque normalmente antes de
  qualquer dismissal.
- **Alternatives considered**:
  - *`keyboardDismissMode="on-drag"`*: cobre apenas o fechamento ao arrastar a lista,
    não ao tocar uma única vez fora de um campo (cenário descrito na clarificação do
    usuário); seria insuficiente isoladamente, mas pode continuar coexistindo sem
    conflito caso já esteja implícito no comportamento padrão do `ScrollView`.

## Decisão 4: Telas de busca ficam fora do escopo

- **Decision**: `src/app/(tabs)/pacientes.tsx` (campo de busca por nome no topo da
  lista) não recebe nenhuma alteração.
- **Rationale**: Confirmado por clarificação com o usuário e por inspeção do código —
  esse campo já está sempre visível no topo da tela e nunca fica atrás do teclado; é o
  único uso de `TextInput` fora dos formulários de paciente/sessão/autenticação.
