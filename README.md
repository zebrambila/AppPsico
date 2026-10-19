# Psico — app para psicólogos

App mobile em **React Native + Expo (managed workflow) + Expo Router**, feito a partir do protótipo do canvas. Ele gerencia pacientes, agenda de sessões, registro de sessão/prontuário e financeiro, com login e cadastro de usuário.

- Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript (strict)
- Navegação por arquivos com Expo Router (rotas em `src/app/`)
- Fonte Plus Jakarta Sans (`@expo-google-fonts`) e ícones Feather (`@expo/vector-icons`)
- Funciona no **Expo Go** (não usa módulos nativos fora do Expo Go)

## Como rodar

```bash
npm install
npx expo start
```

Escaneie o QR code com o app **Expo Go** (Android/iOS), ou pressione `a` (emulador Android), `i` (simulador iOS) ou `w` (navegador).

Outros comandos:

```bash
npm run typecheck   # tsc --noEmit
npx expo-doctor     # verifica dependências/configuração
npx expo install --fix  # alinha versões ao SDK
```

## Estrutura

```
src/
  app/                      # rotas (Expo Router)
    _layout.tsx             # Stack raiz, fontes, splash, providers, rotas protegidas (Stack.Protected)
    index.tsx               # redireciona para /login ou /inicio conforme a sessão
    (auth)/
      login.tsx             # Login (e-mail, senha, mostrar senha, esqueci a senha)
      cadastro.tsx          # Cadastro (nome, e-mail, CRP e celular opcionais, senha + força, termos/LGPD)
    (tabs)/
      _layout.tsx           # barra de abas
      inicio.tsx            # Início
      agenda.tsx            # Agenda semanal + botão "Nova sessão"
      pacientes.tsx         # Lista com busca
      financeiro.tsx        # Resumo do mês, gráfico semanal, lançamentos, cobrança
    paciente/[id].tsx       # Ficha: dados, Sessões / Prontuário / Financeiro
    sessao/registrar.tsx    # Presença, pagamento, anotações
    sessao/nova.tsx         # Agendamento (form sheet / modal)
  components/               # UI reutilizável (Txt, Button, Card, Chip, Pill, Segmented…)
  data/                     # tipos e dados fictícios (mock.ts)
  lib/format.ts             # datas (ISO local), moeda, plurais
  store/                    # AuthStore (sessão) e AppStore (dados) via Context + seletores
  theme/                    # cores, fontes, raios
```

## O que funciona

- **Login e cadastro**: sem sessão, o app só mostra as telas de login e cadastro. Depois de entrar, as telas de entrada deixam de ser acessíveis. O login vem preenchido com uma conta de demonstração (`marina@consultorio.com` / `senha1234`). No cadastro, os campos são validados (e-mail, senha com no mínimo 8 caracteres, confirmação de senha e aceite dos termos), e CRP e celular são opcionais. Tocar no avatar da tela Início faz logout.
- **Início**: próxima sessão, resumo do dia, lista de hoje e pendências. Também dá para confirmar a sessão de um paciente que ainda não respondeu.
- **Agenda**: navegação por semana e dia. Tocar numa sessão abre o registro dela.
- **Nova sessão**: escolha de paciente, data, horário, valor, modalidade e repetição semanal. A tela valida o formato do horário e avisa se já houver outra sessão marcada naquele horário.
- **Registrar sessão**: presença (compareceu/faltou/remarcou), pago/pendente e forma de pagamento. As anotações vão para o prontuário.
- **Financeiro**: recebido, a receber, agendado e previsto, todos calculados a partir dos dados. Tem gráfico por semana, filtros e cobrança com lembrete.
- **Pacientes / ficha**: busca sem diferenciar acentos, situação financeira de cada paciente, histórico, prontuário e pagamentos.

## Próximos passos sugeridos

0. **Autenticação real**: `src/store/AuthStore.tsx` hoje simula login e cadastro só em memória e aceita qualquer senha. Ligue `entrar`, `cadastrar` e `sair` a um provedor real (Supabase Auth, Firebase Auth ou sua API). Guarde o token da sessão com `expo-secure-store` para manter a pessoa logada, e implemente a recuperação de senha de verdade.
1. **Persistência**: hoje o estado fica em memória (`src/store/AppStore.tsx`) e volta aos dados de exemplo ao reiniciar. Opções:
   - local: `expo-sqlite` (inclusive com Drizzle ORM)
   - nuvem: Supabase/Firebase ou uma API própria
2. **Data real**: em `src/data/mock.ts`, troque a constante `HOJE` por `toISO(new Date())` ao remover os dados fictícios.
3. **Segurança do prontuário**: autenticação com `expo-local-authentication` (biometria) e armazenamento cifrado (`expo-secure-store` para chaves). Observe a LGPD e as orientações do CFP sobre registro documental.
4. **Lembretes**: `expo-notifications` para avisar pacientes ou a própria profissional; integração com WhatsApp por deep link (`Linking.openURL('https://wa.me/...')`).
5. **Cadastro e edição de pacientes**: o botão "+ Novo" ainda exibe só um aviso.
6. **Build e publicação**: `npx eas-cli@latest build` e `eas submit`.
