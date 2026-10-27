<!--
Sync Impact Report
Version change: 1.0.0 → 1.0.1
Modified principles: none redefined; full document translated from English to
  Portuguese (pt-BR) at the user's request. No normative/semantic change to any rule.
Added sections: none
Removed sections: none
Templates requiring follow-up:
  - .specify/templates/plan-template.md: review Constitution Check gate against
    principles (⚠ pending manual review, carried over from v1.0.0)
Deferred items / TODOs: none
-->

# Constituição do Psico

## Princípios Fundamentais

### I. Fluxo Gerenciado do Expo & Mobile-First
O app DEVE permanecer no fluxo gerenciado (managed workflow) do Expo. Os diretórios
`ios/` e `android/` são gerados pela Continuous Native Generation (CNG) e NÃO DEVEM ser
criados ou editados manualmente; o comportamento nativo é configurado apenas via
`app.json` e config plugins. Toda a navegação DEVE passar pelo Expo Router: as rotas
ficam em `src/app/`, todo arquivo ali é uma tela, e arquivos `_layout.tsx` definem os
navegadores; código que não é rota (componentes, hooks, utils) DEVE ficar fora de
`src/app/`. Toda tela e componente DEVE ser projetado mobile-first (áreas de toque,
tratamento de safe-area, layout retrato, renderização tolerante a offline) antes de
qualquer preocupação específica de web.
Racional: o fluxo gerenciado somado à CNG é o que permite ao projeto evoluir sem manter
projetos nativos manualmente; misturar pastas nativas editadas à mão ou navegação ad-hoc
quebra essa garantia e causa divergência silenciosa entre a configuração e o código
nativo gerado.

### II. Segurança de Tipos & Portões de Qualidade
O modo estrito do TypeScript é inegociável: código novo NÃO DEVE introduzir `any`,
conversões de tipo (casts) não verificadas, ou erros suprimidos para silenciar o
compilador. Antes de qualquer tarefa ser declarada concluída, `npx expo lint` e
`npx tsc --noEmit` DEVEM ser executados e DEVEM passar sem erros; avisos (warnings)
DEVEM ser corrigidos ou justificados explicitamente na descrição do PR/commit caso
permaneçam. Uma tarefa não está concluída até que ambos os portões estejam verdes.
Racional: este é um código mobile de equipe pequena/solo sem um portão de CI aplicado
em outra etapa deste fluxo; os comandos de lint e typecheck são a única rede de
segurança automatizada antes das mudanças chegarem a um dispositivo, então ignorá-los
anula a única verificação de corretude do projeto.

### III. Privacidade dos Dados de Pacientes (LGPD)
Este app armazena e exibe registros de sessões de psicólogo (`prontuário`), dados de
contato de pacientes e dados financeiros — todos dados pessoais sensíveis/de saúde sob
a LGPD. Qualquer funcionalidade que toque em registros de pacientes DEVE tratar a
confidencialidade como requisito inegociável: nenhum dado de paciente pode ser logado,
enviado a serviços de analytics de terceiros, ou persistido em texto puro quando um
armazenamento real (`expo-secure-store`, banco cifrado, ou um backend) for introduzido.
Autenticação e autorização DEVEM controlar o acesso às telas de `prontuário` e
financeiro; a autenticação atual, em memória e de demonstração
(`src/store/AuthStore.tsx`), é explicitamente um placeholder e DEVE ser substituída por
autenticação real antes de qualquer release em produção com dados reais de pacientes.
Funcionalidades que relaxem essas garantias por conveniência (ex.: cachear dados de
paciente sem cifrar, pular verificações de autenticação) DEVEM ser rejeitadas ou
sinalizadas, nunca mescladas silenciosamente.
Racional: o valor central do produto é lidar com registros clínicos e financeiros de
uma profissão regulamentada; uma falha de privacidade ou confidencialidade não é um bug
de qualidade, e sim uma falha legal e ética, muito mais cara de corrigir depois do que
de prevenir no design.

### IV. Disciplina de Dependências & SDK
As APIs do Expo/React Native/EAS mudam entre versões do SDK mais rápido do que o
conhecimento geral de treinamento acompanha. Antes de escrever código contra uma API do
Expo, EAS ou React Native, a versão major atual do `expo` em `package.json` DEVE ser
verificada e, quando o comportamento for incerto, a documentação da versão
correspondente (`https://docs.expo.dev/versions/v<major>.0.0/`) ou
`https://docs.expo.dev/llms.txt` DEVE ser consultada em vez de responder de memória.
Pacotes DEVEM ser adicionados com `npx expo install <package>` (ou o equivalente em Bun
quando `bun.lock` estiver presente), nunca diretamente com `npm/yarn/pnpm add`, para que
as versões permaneçam compatíveis com o SDK. Prefira módulos Expo recomendados/oficiais
a alternativas de terceiros, a menos que uma capacidade específica esteja faltando.
Racional: usar o caminho de instalação errado ou uma API lembrada de forma desatualizada
é uma causa comum de bugs de incompatibilidade de versão que `expo-doctor` e
`expo install --fix` existem justamente para capturar depois do fato; consultar a
documentação e usar o comando de instalação correto evita criar o problema desde o
início.

### V. Simplicidade & Sem Abstração Especulativa
Implemente apenas o que a tarefa atual exige, nada além disso. Não adicione flags de
configuração, camadas de abstração, utilitários auxiliares, ou atalhos de
compatibilidade retroativa para cenários que o app não exercita atualmente. Uma
correção de bug permanece restrita ao bug; uma tela ou cálculo pontual não precisa de um
framework genérico. Três linhas de código semelhantes são preferíveis a uma abstração
compartilhada prematura extraída para um único chamador.
Racional: este é um código mobile pequeno (ver a estrutura de `src/` no `README.md`)
construído e mantido por uma equipe pequena; abstração especulativa aqui adiciona
indireção que atrapalha a próxima mudança com muito mais frequência do que compensa.

## Restrições de Tecnologia

A stack é fixa como: Expo SDK 58 (fluxo gerenciado), React Native 0.88, React 19.3,
TypeScript em modo estrito, e Expo Router para navegação. Fontes são carregadas via
`@expo-google-fonts`, ícones via `@expo/vector-icons` (Feather). O app DEVE continuar
funcionando dentro do Expo Go enquanto nenhum módulo nativo fora do conjunto empacotado
do Expo Go for necessário; no momento em que uma biblioteca com código nativo for
adicionada, um development build (`npx expo run:ios|android` ou
`eas build --profile development`) passa a ser obrigatório, e esta seção de restrições
DEVE ser atualizada para refletir que o app não funciona mais no Expo Go puro. O EAS
(`eas build`, `eas submit`, `eas update`) é o caminho designado para builds na nuvem,
assinatura, submissão e atualizações OTA — executado via `bunx eas-cli@latest` ou
`npx eas-cli@latest` conforme o caso; builds locais com Xcode/Android Studio não são o
fluxo padrão.

## Fluxo de Desenvolvimento & Portões de Qualidade

Comandos padrão deste repositório: `npx expo install <package>` para adicionar
dependências, `npx expo start` para rodar o servidor de desenvolvimento,
`npx expo lint` e `npx tsc --noEmit` antes de qualquer mudança ser considerada
concluída, `npx expo-doctor` para diagnosticar divergências de dependências/configuração,
e `npx expo install --fix` para realinhar versões ao SDK. Para mudanças de UI/frontend,
a funcionalidade DEVE ser exercitada em um app em execução (simulador, dispositivo, ou
Expo Go) ao longo do caminho principal e das bordas relevantes antes de ser reportada
como concluída; passar `tsc`/lint é necessário, mas não é evidência suficiente de que
uma funcionalidade de UI funciona. Quando uma mudança não puder ser verificada
manualmente no app, essa limitação DEVE ser declarada explicitamente, em vez de insinuar
que a funcionalidade foi confirmada funcionando.

## Governança

Esta constituição se sobrepõe a práticas ad-hoc em qualquer conflito entre "como sempre
foi feito neste repositório" e o que está escrito aqui. Emendas são feitas editando
`.specify/memory/constitution.md` diretamente, seguindo o formato de Sync Impact Report
já presente no topo deste arquivo, e DEVEM declarar o incremento de versão e o racional.
O versionamento segue versionamento semântico para documentos de governança: MAJOR para
remoções ou redefinições incompatíveis de um princípio, MINOR para adição de um novo
princípio ou expansão material de uma orientação existente, PATCH para correções de
redação/clareza sem mudança normativa. Qualquer plano, especificação ou conjunto de
tarefas produzido pelo fluxo do Spec Kit DEVE ser verificado contra estes princípios
(especialmente os Princípios II, III e V) antes de ser tratado como pronto para
implementação; uma violação de princípio encontrada nessa revisão DEVE ser resolvida ou
explicitamente justificada no artefato antes de prosseguir. Use o `AGENTS.md` na raiz do
repositório para orientação operacional do dia a dia, que complementa, mas não se
sobrepõe, a esta constituição.

**Versão**: 1.0.1 | **Ratificada em**: 2026-10-18 | **Última Emenda**: 2026-10-19
