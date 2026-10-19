import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  gerarId,
  HOJE,
  lancamentosIniciais,
  notasIniciais,
  pacientesIniciais,
  sessoesIniciais,
} from '@/data/mock';
import type {
  Lancamento,
  MetodoPagamento,
  Modalidade,
  Nota,
  Paciente,
  Presenca,
  Sessao,
} from '@/data/types';
import { addDays } from '@/lib/format';

export interface NovaSessaoInput {
  pacienteId: string;
  data: string;
  hora: string;
  modalidade: Modalidade;
  valor: number;
  /** cria também as próximas 3 ocorrências semanais */
  repetirSemanal: boolean;
}

export interface RegistroSessaoInput {
  /** sessão existente; se ausente, cria uma sessão hoje no horário fixo do paciente */
  sessaoId?: string;
  pacienteId: string;
  presenca: Presenca;
  pago: boolean;
  metodo: MetodoPagamento;
  nota: string;
}

interface AppState {
  hoje: string;
  pacientes: Paciente[];
  sessoes: Sessao[];
  lancamentos: Lancamento[];
  notas: Nota[];
  toast: string | null;

  paciente: (id: string) => Paciente | undefined;
  showToast: (msg: string) => void;
  agendarSessao: (input: NovaSessaoInput) => void;
  registrarSessao: (input: RegistroSessaoInput) => void;
  confirmarSessao: (sessaoId: string) => void;
  cobrar: (lancamentoId: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [pacientes] = useState<Paciente[]>(pacientesIniciais);
  const [sessoes, setSessoes] = useState<Sessao[]>(sessoesIniciais);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(lancamentosIniciais);
  const [notas, setNotas] = useState<Nota[]>(notasIniciais);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const paciente = useCallback((id: string) => pacientes.find((p) => p.id === id), [pacientes]);

  const agendarSessao = useCallback((input: NovaSessaoInput) => {
    const total = input.repetirSemanal ? 4 : 1;
    const novas: Sessao[] = Array.from({ length: total }, (_, i) => ({
      id: gerarId('s'),
      pacienteId: input.pacienteId,
      data: addDays(input.data, 7 * i),
      hora: input.hora,
      status: 'confirmada',
      modalidade: input.modalidade,
      valor: input.valor,
      duracaoMin: 50,
    }));
    setSessoes((prev) => [...prev, ...novas]);
  }, []);

  const registrarSessao = useCallback(
    (input: RegistroSessaoInput) => {
      const p = pacientes.find((x) => x.id === input.pacienteId);
      if (!p) return;
      const status = input.presenca === 'compareceu' ? 'realizada' : input.presenca === 'faltou' ? 'faltou' : 'remarcada';

      let sessaoId = input.sessaoId;
      let sessao = sessaoId ? sessoes.find((s) => s.id === sessaoId) : undefined;
      if (!sessao) {
        sessao = {
          id: gerarId('s'),
          pacienteId: p.id,
          data: HOJE,
          hora: p.horaFixa,
          status,
          modalidade: p.modalidade,
          valor: p.valorSessao,
          duracaoMin: 50,
        };
        sessaoId = sessao.id;
        const nova = sessao;
        setSessoes((prev) => [...prev, nova]);
      } else {
        setSessoes((prev) => prev.map((s) => (s.id === sessaoId ? { ...s, status } : s)));
      }
      const base = sessao;

      // Financeiro: só gera cobrança quando o paciente compareceu.
      setLancamentos((prev) => {
        const semEsta = prev.filter((l) => l.sessaoId !== sessaoId);
        if (status !== 'realizada') return semEsta;
        return [
          ...semEsta,
          {
            id: gerarId('l'),
            pacienteId: p.id,
            sessaoId,
            data: base.data,
            valor: base.valor,
            pago: input.pago,
            metodo: input.pago ? input.metodo : undefined,
          },
        ];
      });

      const texto = input.nota.trim();
      if (texto) {
        setNotas((prev) => [
          ...prev,
          { id: gerarId('n'), pacienteId: p.id, sessaoId, data: base.data, texto },
        ]);
      }
    },
    [pacientes, sessoes],
  );

  const confirmarSessao = useCallback((sessaoId: string) => {
    setSessoes((prev) => prev.map((s) => (s.id === sessaoId ? { ...s, status: 'confirmada' } : s)));
  }, []);

  const cobrar = useCallback((lancamentoId: string) => {
    setLancamentos((prev) => prev.map((l) => (l.id === lancamentoId ? { ...l, cobrado: true } : l)));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      hoje: HOJE,
      pacientes,
      sessoes,
      lancamentos,
      notas,
      toast,
      paciente,
      showToast,
      agendarSessao,
      registrarSessao,
      confirmarSessao,
      cobrar,
    }),
    [pacientes, sessoes, lancamentos, notas, toast, paciente, showToast, agendarSessao, registrarSessao, confirmarSessao, cobrar],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp precisa estar dentro de <AppProvider>');
  return ctx;
}
