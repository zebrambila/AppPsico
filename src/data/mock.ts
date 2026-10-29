/**
 * Dados fictícios para demonstração — substitua por sua API/banco de dados.
 * Toda a semana de exemplo gira em torno de HOJE.
 */
import { addDays, startOfWeek } from '@/lib/format';
import type { Lancamento, MetodoPagamento, Nota, Paciente, Sessao, StatusSessao } from './types';

/** Data "de hoje" usada pelos dados de exemplo. Troque por toISO(new Date()) ao usar dados reais. */
export const HOJE = '2026-10-15';

export const pacientesIniciais: Paciente[] = [
  { id: 'p1', nome: 'Ana Ribeiro', iniciais: 'AR', frequencia: 'Semanal', diaFixo: 4, horaFixa: '09:00', modalidade: 'Presencial', valorSessao: 200, desde: '2025-03-10', telefone: '(11) 90000-0001', excluido: false },
  { id: 'p2', nome: 'Bruno Carvalho', iniciais: 'BC', frequencia: 'Semanal', diaFixo: 4, horaFixa: '10:30', modalidade: 'Online', valorSessao: 180, desde: '2026-04-02', telefone: '(11) 90000-0002', excluido: false },
  { id: 'p3', nome: 'Camila Duarte', iniciais: 'CD', frequencia: 'Semanal', diaFixo: 4, horaFixa: '14:00', modalidade: 'Presencial', valorSessao: 200, desde: '2026-01-15', telefone: '(11) 90000-0003', excluido: false },
  { id: 'p4', nome: 'Diego Martins', iniciais: 'DM', frequencia: 'Semanal', diaFixo: 4, horaFixa: '16:00', modalidade: 'Presencial', valorSessao: 180, desde: '2026-08-06', telefone: '(11) 90000-0004', excluido: false },
  { id: 'p5', nome: 'Elisa Nogueira', iniciais: 'EN', frequencia: 'Semanal', diaFixo: 4, horaFixa: '18:30', modalidade: 'Online', valorSessao: 220, desde: '2024-11-07', telefone: '(11) 90000-0005', excluido: false },
  { id: 'p6', nome: 'Felipe Souza', iniciais: 'FS', frequencia: 'Quinzenal', diaFixo: 5, horaFixa: '11:00', modalidade: 'Presencial', valorSessao: 250, desde: '2026-06-12', telefone: '(11) 90000-0006', excluido: false },
  { id: 'p7', nome: 'Gabriela Lima', iniciais: 'GL', frequencia: 'Semanal', diaFixo: 5, horaFixa: '09:00', modalidade: 'Presencial', valorSessao: 200, desde: '2026-02-06', telefone: '(11) 90000-0007', excluido: false },
];

const byId = Object.fromEntries(pacientesIniciais.map((p) => [p.id, p]));
const segunda = startOfWeek(HOJE);

let seq = 0;
const nextId = (prefix: string) => `${prefix}${++seq}`;

function sessao(pacienteId: string, data: string, hora: string, status: StatusSessao): Sessao {
  const p = byId[pacienteId];
  return {
    id: nextId('s'),
    pacienteId,
    data,
    hora,
    status,
    modalidade: p.modalidade,
    valor: p.valorSessao,
    duracaoMin: 50,
    excluida: false,
  };
}

/** Semana atual (segunda a sábado), igual ao protótipo. */
const semana: [number, string, string, StatusSessao][] = [
  [0, 'p1', '09:00', 'realizada'],
  [0, 'p4', '11:00', 'realizada'],
  [0, 'p7', '16:00', 'faltou'],
  [1, 'p2', '10:00', 'realizada'],
  [1, 'p5', '14:00', 'realizada'],
  [1, 'p3', '18:00', 'realizada'],
  [2, 'p6', '09:00', 'realizada'],
  [2, 'p7', '15:00', 'realizada'],
  [3, 'p1', '09:00', 'realizada'],
  [3, 'p2', '10:30', 'confirmada'],
  [3, 'p3', '14:00', 'confirmada'],
  [3, 'p4', '16:00', 'pendente'],
  [3, 'p5', '18:30', 'confirmada'],
  [4, 'p7', '09:00', 'pendente'],
  [4, 'p6', '11:00', 'confirmada'],
];

/** Histórico: as 4 semanas anteriores no horário fixo de cada paciente. */
function historico(): Sessao[] {
  const out: Sessao[] = [];
  for (const p of pacientesIniciais) {
    for (let w = 4; w >= 1; w--) {
      const inicio = addDays(segunda, -7 * w);
      const offset = (p.diaFixo + 6) % 7; // segunda = 0
      const data = addDays(inicio, offset);
      if (data < p.desde) continue;
      const faltou = p.id === 'p7' && w === 3;
      out.push(sessao(p.id, data, p.horaFixa, faltou ? 'faltou' : 'realizada'));
    }
  }
  return out;
}

export const sessoesIniciais: Sessao[] = [
  ...historico(),
  ...semana.map(([dia, pid, hora, status]) => sessao(pid, addDays(segunda, dia), hora, status)),
];

/** Sessões realizadas desta semana ainda não pagas (pacienteId + data). */
const emAberto = new Set(['p2|' + addDays(segunda, 1), 'p6|' + addDays(segunda, 2), 'p7|' + addDays(segunda, 2)]);
const metodos: MetodoPagamento[] = ['Pix', 'Cartão', 'Pix', 'Dinheiro'];

export const lancamentosIniciais: Lancamento[] = sessoesIniciais
  .filter((s) => s.status === 'realizada')
  .map((s, i) => {
    const aberto = emAberto.has(`${s.pacienteId}|${s.data}`);
    return {
      id: nextId('l'),
      pacienteId: s.pacienteId,
      sessaoId: s.id,
      data: s.data,
      valor: s.valor,
      pago: !aberto,
      metodo: aberto ? undefined : metodos[i % metodos.length],
      excluido: false,
    };
  });

export const notasIniciais: Nota[] = pacientesIniciais.flatMap((p) => {
  const ultimas = sessoesIniciais
    .filter((s) => s.pacienteId === p.id && s.status === 'realizada' && s.data < segunda)
    .slice(-2)
    .reverse();
  const textos = [
    'Retomamos o tema da rotina de trabalho. Combinado: registrar horários de sono ao longo da semana para conversarmos na próxima sessão.',
    'Sessão centrada nas relações familiares. Relatou avanços na comunicação com a irmã; seguir explorando limites pessoais.',
  ];
  return ultimas.map((s, i) => ({
    id: nextId('n'),
    pacienteId: p.id,
    sessaoId: s.id,
    data: s.data,
    texto: textos[i],
    excluida: false,
  }));
});

export function gerarId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
