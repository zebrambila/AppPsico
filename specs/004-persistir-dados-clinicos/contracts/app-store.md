# Contrato: `useApp()` (AppStore)

**Feature**: `004-persistir-dados-clinicos` | **Date**: 2026-10-26

Contrato interno de módulo (padrão de aplicação) consumido pelas telas de Início,
Agenda, Pacientes, ficha do paciente e Financeiro — não é uma API de rede exposta pelo
app. Descreve o comportamento observável exigido pela spec; não prescreve a
implementação interna do hook (hoje `src/store/AppStore.tsx`).

Comparado ao contrato atual (em memória), os campos/métodos abaixo marcados **(novo)**
são adicionados por esta feature; os demais mantêm a mesma assinatura, mas passam a
operar sobre dados persistidos no Supabase em vez de `src/data/mock.ts`.

## Estado exposto

| Campo | Tipo | Descrição |
|---|---|---|
| `hoje` | `string` | Inalterado. |
| `pacientes` | `Paciente[]` | Agora carregado do Supabase, filtrado por conta via RLS. |
| `sessoes` | `Sessao[]` | Idem. |
| `lancamentos` | `Lancamento[]` | Idem. |
| `notas` | `Nota[]` | Idem. |
| `toast` | `string \| null` | Inalterado. |
| `carregando` **(novo)** | `boolean` | `true` enquanto a carga inicial de pacientes/sessões/lançamentos/notas ainda não terminou após autenticar (FR-001–FR-008 dependem de dados já carregados). |

## Operações existentes (mesma assinatura, agora assíncronas onde grava dados)

### `paciente(id: string): Paciente | undefined`
Inalterado — busca em memória sobre o array já carregado.

### `showToast(msg: string): void`
Inalterado.

### `agendarSessao(input: NovaSessaoInput): Promise<void>`
- **Sucesso**: grava a(s) nova(s) sessão(ões) no Supabase e atualiza `sessoes` a
  partir da resposta do banco (FR-004).
- **Falha** (sem conexão ou erro do banco): rejeita com uma mensagem amigável; nenhuma
  sessão parcial é adicionada ao estado local (FR-010).

### `registrarSessao(input: RegistroSessaoInput): Promise<void>`
- **Sucesso**: grava o novo status da sessão, cria/atualiza o lançamento financeiro
  correspondente e, se houver texto, a nota — tudo vinculado corretamente (FR-005,
  FR-006, FR-008, FR-012) — e atualiza `sessoes`/`lancamentos`/`notas` a partir da
  resposta do banco.
- **Falha**: rejeita sem deixar nenhuma das três gravações parcialmente aplicada
  (FR-010) — ver `research.md` para a abordagem de consistência adotada na implementação.

### `confirmarSessao(sessaoId: string): Promise<void>`
- **Sucesso**: grava o novo status `'confirmada'` (FR-005).
- **Falha**: rejeita; status local não muda.

### `cobrar(lancamentoId: string): Promise<void>`
- Comportamento inalterado (marca `cobrado: true`, lembrete de cobrança) — apenas
  passa a persistir no Supabase em vez de em memória.

## Operações novas (exigidas pela spec; não existiam no contrato anterior)

### `criarPaciente(input: NovoPacienteInput): Promise<Paciente>` **(novo)**
- **Entrada**: `{ nome, frequencia, diaFixo, horaFixa, modalidade, valorSessao, desde, telefone }` (FR-001).
- **Sucesso**: cria o paciente vinculado à conta autenticada, adiciona a `pacientes`, e
  resolve com o paciente criado (para navegar à ficha dele).
- **Falha**: sem conexão ou erro de validação do banco — rejeita com mensagem amigável,
  sem adicionar nada a `pacientes` (FR-010).

### `editarPaciente(id: string, input: NovoPacienteInput): Promise<void>` **(novo)**
- **Sucesso**: atualiza os dados do paciente (FR-002); reflete em `pacientes`.
- **Falha**: rejeita sem alterar o estado local.

### `excluirPaciente(id: string): Promise<void>` **(novo)**
- **Sucesso** (paciente sem nenhuma sessão/lançamento/nota vinculado): remove o
  paciente de `pacientes`.
- **Falha** (paciente com histórico vinculado): rejeita com uma mensagem que explica
  que o paciente tem histórico e por isso não pode ser excluído (FR-009) — a tela
  traduz essa rejeição (originada da violação de chave estrangeira no Postgres, ver
  `research.md` Decisão 2) em texto para a usuária, sem expor detalhes técnicos do erro.

### `marcarComoPago(lancamentoId: string, metodo: MetodoPagamento): Promise<void>` **(novo)**
- **Sucesso**: grava `pago: true` e o método informado no lançamento (FR-007);
  reflete em `lancamentos`.
- **Falha**: rejeita sem alterar o estado local.

## Garantias transversais (todas as operações de escrita)

- Toda operação de escrita (`agendarSessao`, `registrarSessao`, `confirmarSessao`,
  `cobrar`, `criarPaciente`, `editarPaciente`, `excluirPaciente`, `marcarComoPago`)
  verifica conectividade antes de iniciar a chamada ao Supabase (reaproveitando
  `useConectividade`, spec 003) e rejeita imediatamente com a mensagem de FR-010 se não
  houver conexão, sem sequer tentar a chamada de rede.
- Nenhuma operação deixa o estado local (`pacientes`/`sessoes`/`lancamentos`/`notas`)
  em um valor que não corresponda a uma gravação já confirmada pelo banco — sem estado
  otimista que precise ser revertido em caso de erro (FR-010).
- Toda linha lida ou gravada por estas operações pertence exclusivamente à conta
  autenticada — reforçado por Row Level Security no banco, não apenas pela lógica do
  hook (FR-003, Princípio III).
