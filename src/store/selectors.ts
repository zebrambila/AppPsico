import type { Lancamento, Sessao } from '@/data/types';
import { parseISO } from '@/lib/format';

export const ordenarPorHora = (a: Sessao, b: Sessao) => a.hora.localeCompare(b.hora);
export const ordenarPorDataDesc = (a: { data: string; hora?: string }, b: { data: string; hora?: string }) =>
  b.data.localeCompare(a.data) || (b.hora ?? '').localeCompare(a.hora ?? '');

export function sessoesDoDia(sessoes: Sessao[], data: string): Sessao[] {
  return sessoes.filter((s) => s.data === data).sort(ordenarPorHora);
}

export function emAbertoDoPaciente(lancamentos: Lancamento[], pacienteId: string): Lancamento[] {
  return lancamentos.filter((l) => l.pacienteId === pacienteId && !l.pago);
}

export const soma = (xs: { valor: number }[]) => xs.reduce((acc, x) => acc + x.valor, 0);

export const mesmoMes = (iso: string, ref: string) => iso.slice(0, 7) === ref.slice(0, 7);

export interface ResumoMes {
  recebido: number;
  aReceber: number;
  agendado: number;
  previsto: number;
  sessoesPagas: number;
  semanas: { rotulo: string; recebido: number; previsto: number }[];
}

/** Agrega o mês da data de referência: recebido (pagos), a receber (abertos) e agendado (sessões futuras). */
export function resumoDoMes(sessoes: Sessao[], lancamentos: Lancamento[], ref: string): ResumoMes {
  const doMes = lancamentos.filter((l) => mesmoMes(l.data, ref));
  const pagos = doMes.filter((l) => l.pago);
  const abertos = doMes.filter((l) => !l.pago);
  const futuras = sessoes.filter(
    (s) => mesmoMes(s.data, ref) && (s.status === 'confirmada' || s.status === 'pendente'),
  );

  const recebido = soma(pagos);
  const aReceber = soma(abertos);
  const agendado = soma(futuras);

  const ultimoDia = new Date(parseISO(ref).getFullYear(), parseISO(ref).getMonth() + 1, 0).getDate();
  const faixas: [number, number][] = [];
  for (let ini = 1; ini <= ultimoDia; ini += 7) faixas.push([ini, Math.min(ini + 6, ultimoDia)]);
  const dia = (iso: string) => parseISO(iso).getDate();

  const semanas = faixas.map(([ini, fim], i) => ({
    rotulo: `S${i + 1}`,
    recebido: soma(pagos.filter((l) => dia(l.data) >= ini && dia(l.data) <= fim)),
    previsto: soma(futuras.filter((s) => dia(s.data) >= ini && dia(s.data) <= fim)),
  }));

  return {
    recebido,
    aReceber,
    agendado,
    previsto: recebido + aReceber + agendado,
    sessoesPagas: pagos.length,
    semanas,
  };
}
