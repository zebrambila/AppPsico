export type Modalidade = 'Presencial' | 'Online';
export type Frequencia = 'Semanal' | 'Quinzenal' | 'Mensal';
export type MetodoPagamento = 'Pix' | 'Cartão' | 'Dinheiro' | 'Convênio';
export type Presenca = 'compareceu' | 'faltou' | 'remarcou';

export type StatusSessao = 'realizada' | 'confirmada' | 'pendente' | 'faltou' | 'remarcada';

export interface Paciente {
  id: string;
  nome: string;
  iniciais: string;
  frequencia: Frequencia;
  /** dia da semana fixo (0 = domingo) */
  diaFixo: number;
  horaFixa: string;
  modalidade: Modalidade;
  valorSessao: number;
  /** "AAAA-MM-DD" */
  desde: string;
  telefone: string;
  /** true quando o paciente foi excluído (exclusão lógica); nunca apagado de fato. */
  excluido: boolean;
}

export interface Sessao {
  id: string;
  pacienteId: string;
  /** "AAAA-MM-DD" */
  data: string;
  /** "HH:MM" */
  hora: string;
  status: StatusSessao;
  modalidade: Modalidade;
  valor: number;
  duracaoMin: number;
  /** true quando a sessão foi excluída (exclusão lógica); nunca apagada de fato. */
  excluida: boolean;
}

export interface Lancamento {
  id: string;
  pacienteId: string;
  sessaoId?: string;
  data: string;
  valor: number;
  pago: boolean;
  metodo?: MetodoPagamento;
  /** lembrete de cobrança enviado */
  cobrado?: boolean;
  /** true quando o lançamento foi excluído (exclusão lógica); nunca apagado de fato. */
  excluido: boolean;
}

export interface Nota {
  id: string;
  pacienteId: string;
  sessaoId?: string;
  data: string;
  texto: string;
  /** true quando a nota foi excluída (direta ou em cascata); a nota é preservada, mas sai do prontuário normal. */
  excluida: boolean;
}
