const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LONGOS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Datas são strings ISO locais "AAAA-MM-DD" para evitar problemas de fuso. */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function weekdayIndex(iso: string): number {
  return parseISO(iso).getDay();
}

/** Segunda-feira da semana da data. */
export function startOfWeek(iso: string): string {
  const wd = weekdayIndex(iso);
  const diff = wd === 0 ? -6 : 1 - wd;
  return addDays(iso, diff);
}

export const diaCurto = (iso: string) => DIAS_CURTOS[weekdayIndex(iso)];
export const diaDoMes = (iso: string) => parseISO(iso).getDate();

/** "15 out" */
export function fmtCurta(iso: string): string {
  const d = parseISO(iso);
  return `${pad(d.getDate())} ${MESES[d.getMonth()]}`;
}

/** "15 out 2026" */
export function fmtLonga(iso: string): string {
  return `${fmtCurta(iso)} ${parseISO(iso).getFullYear()}`;
}

/** "Qui, 15 out" */
export function fmtDiaSemana(iso: string): string {
  return `${diaCurto(iso)}, ${fmtCurta(iso)}`;
}

/** "Quinta-feira, 15 de outubro" */
export function fmtCabecalho(iso: string): string {
  const d = parseISO(iso);
  return `${DIAS_LONGOS[d.getDay()]}, ${d.getDate()} de ${MESES_LONGOS[d.getMonth()]}`;
}

/** "Outubro 2026" */
export function fmtMesAno(iso: string): string {
  const d = parseISO(iso);
  const m = MESES_LONGOS[d.getMonth()];
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${d.getFullYear()}`;
}

/** "Out 2026" */
export function fmtMesAnoCurto(iso: string): string {
  const d = parseISO(iso);
  const m = MESES[d.getMonth()];
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${d.getFullYear()}`;
}

/** "R$ 1.230" (sem depender de Intl, que varia entre engines) */
export function moeda(valor: number): string {
  const inteiro = Math.round(valor);
  const s = String(Math.abs(inteiro)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${inteiro < 0 ? '-' : ''}R$ ${s}`;
}

/** "2,6k" */
export function milhar(valor: number): string {
  return `${(valor / 1000).toFixed(1).replace('.', ',')}k`;
}

export function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export function primeiroNome(nome: string): string {
  return nome.split(' ')[0];
}

export function horaValida(hora: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

/** Aplica a máscara "(XX) xxxxx-xxxx" progressivamente, a partir dos dígitos informados. */
export function fmtTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}
