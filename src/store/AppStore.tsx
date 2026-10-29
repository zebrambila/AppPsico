import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type {
  Lancamento,
  MetodoPagamento,
  Modalidade,
  Nota,
  Paciente,
  Presenca,
  Sessao,
  StatusSessao,
} from '@/data/types';
import { useConectividade } from '@/hooks/useConectividade';
import { addDays, toISO } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/AuthStore';

export interface NovoPacienteInput {
  nome: string;
  frequencia: Paciente['frequencia'];
  diaFixo: number;
  horaFixa: string;
  modalidade: Modalidade;
  valorSessao: number;
  desde: string;
  telefone: string;
}

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
  /** true enquanto os dados iniciais da conta ainda não terminaram de carregar. */
  carregando: boolean;

  paciente: (id: string) => Paciente | undefined;
  showToast: (msg: string) => void;
  criarPaciente: (input: NovoPacienteInput) => Promise<Paciente>;
  editarPaciente: (id: string, input: NovoPacienteInput) => Promise<void>;
  excluirPaciente: (id: string) => Promise<void>;
  agendarSessao: (input: NovaSessaoInput) => Promise<void>;
  registrarSessao: (input: RegistroSessaoInput) => Promise<void>;
  confirmarSessao: (sessaoId: string) => Promise<void>;
  excluirSessao: (sessaoId: string) => Promise<void>;
  excluirSessoesEmLote: (sessaoIds: string[]) => Promise<{ excluidas: string[]; naoProcessadas: string[] }>;
  cobrar: (lancamentoId: string) => Promise<void>;
  marcarComoPago: (lancamentoId: string, metodo: MetodoPagamento) => Promise<void>;
  removerLancamento: (lancamentoId: string) => Promise<void>;
  removerLancamentosEmLote: (
    lancamentoIds: string[],
  ) => Promise<{ removidos: string[]; naoProcessados: string[] }>;
  excluirNota: (notaId: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

const SEM_CONEXAO = 'Sem conexão com a internet. Verifique e tente novamente.';

/* ---------- Conversão entre linhas do Supabase (snake_case) e os tipos do app ---------- */

interface LinhaPaciente {
  id: string;
  nome: string;
  iniciais: string;
  frequencia: Paciente['frequencia'];
  dia_fixo: number;
  hora_fixa: string;
  modalidade: Modalidade;
  valor_sessao: number;
  desde: string;
  telefone: string;
  excluido: boolean;
}

interface LinhaSessao {
  id: string;
  paciente_id: string;
  data: string;
  hora: string;
  status: StatusSessao;
  modalidade: Modalidade;
  valor: number;
  duracao_min: number;
  excluida: boolean;
}

interface LinhaLancamento {
  id: string;
  paciente_id: string;
  sessao_id: string | null;
  data: string;
  valor: number;
  pago: boolean;
  metodo: MetodoPagamento | null;
  cobrado: boolean;
  excluido: boolean;
}

interface LinhaNota {
  id: string;
  paciente_id: string;
  sessao_id: string | null;
  data: string;
  texto: string;
  excluida: boolean;
}

const dePaciente = (r: LinhaPaciente): Paciente => ({
  id: r.id,
  nome: r.nome,
  iniciais: r.iniciais,
  frequencia: r.frequencia,
  diaFixo: r.dia_fixo,
  horaFixa: r.hora_fixa,
  modalidade: r.modalidade,
  valorSessao: Number(r.valor_sessao),
  desde: r.desde,
  telefone: r.telefone,
  excluido: r.excluido,
});

const deSessao = (r: LinhaSessao): Sessao => ({
  id: r.id,
  pacienteId: r.paciente_id,
  data: r.data,
  hora: r.hora,
  status: r.status,
  modalidade: r.modalidade,
  valor: Number(r.valor),
  duracaoMin: r.duracao_min,
  excluida: r.excluida,
});

const deLancamento = (r: LinhaLancamento): Lancamento => ({
  id: r.id,
  pacienteId: r.paciente_id,
  sessaoId: r.sessao_id ?? undefined,
  data: r.data,
  valor: Number(r.valor),
  pago: r.pago,
  metodo: r.metodo ?? undefined,
  cobrado: r.cobrado,
  excluido: r.excluido,
});

const deNota = (r: LinhaNota): Nota => ({
  id: r.id,
  pacienteId: r.paciente_id,
  sessaoId: r.sessao_id ?? undefined,
  data: r.data,
  texto: r.texto,
  excluida: r.excluida,
});

const iniciaisDePaciente = (nome: string) => {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const conectado = useConectividade();

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [carregando, setCarregando] = useState(true);
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

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      if (!usuario) {
        setPacientes([]);
        setSessoes([]);
        setLancamentos([]);
        setNotas([]);
        setCarregando(false);
        return;
      }

      const [rp, rs, rl, rn] = await Promise.all([
        supabase.from('pacientes').select('*').eq('excluido', false),
        supabase.from('sessoes').select('*').eq('excluida', false),
        supabase.from('lancamentos').select('*').eq('excluido', false),
        supabase.from('notas').select('*').eq('excluida', false),
      ]);
      if (cancelado) return;
      const erro = rp.error ?? rs.error ?? rl.error ?? rn.error;
      if (erro) {
        showToast('Não foi possível carregar seus dados. Verifique sua conexão.');
      } else {
        setPacientes((rp.data as LinhaPaciente[]).map(dePaciente));
        setSessoes((rs.data as LinhaSessao[]).map(deSessao));
        setLancamentos((rl.data as LinhaLancamento[]).map(deLancamento));
        setNotas((rn.data as LinhaNota[]).map(deNota));
      }
      setCarregando(false);
    }

    void carregar();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id]);

  const paciente = useCallback((id: string) => pacientes.find((p) => p.id === id), [pacientes]);

  const exigirConexao = useCallback(() => {
    if (!conectado) throw new Error(SEM_CONEXAO);
  }, [conectado]);

  const criarPaciente = useCallback(
    async (input: NovoPacienteInput): Promise<Paciente> => {
      exigirConexao();
      if (!usuario) throw new Error('Sessão inválida.');
      const { data, error } = await supabase
        .from('pacientes')
        .insert({
          psicologa_id: usuario.id,
          nome: input.nome,
          iniciais: iniciaisDePaciente(input.nome),
          frequencia: input.frequencia,
          dia_fixo: input.diaFixo,
          hora_fixa: input.horaFixa,
          modalidade: input.modalidade,
          valor_sessao: input.valorSessao,
          desde: input.desde,
          telefone: input.telefone,
        })
        .select('*')
        .single();
      if (error || !data) throw new Error('Não foi possível cadastrar o paciente.');
      const novo = dePaciente(data as LinhaPaciente);
      setPacientes((prev) => [...prev, novo]);
      return novo;
    },
    [usuario, exigirConexao],
  );

  const editarPaciente = useCallback(
    async (id: string, input: NovoPacienteInput): Promise<void> => {
      exigirConexao();
      const { data, error } = await supabase
        .from('pacientes')
        .update({
          nome: input.nome,
          iniciais: iniciaisDePaciente(input.nome),
          frequencia: input.frequencia,
          dia_fixo: input.diaFixo,
          hora_fixa: input.horaFixa,
          modalidade: input.modalidade,
          valor_sessao: input.valorSessao,
          desde: input.desde,
          telefone: input.telefone,
        })
        .eq('id', id)
        .select('*')
        .single();
      if (error || !data) throw new Error('Não foi possível salvar as alterações.');
      const atualizado = dePaciente(data as LinhaPaciente);
      setPacientes((prev) => prev.map((p) => (p.id === id ? atualizado : p)));
    },
    [exigirConexao],
  );

  const excluirPaciente = useCallback(
    async (id: string): Promise<void> => {
      exigirConexao();
      // Cascata completa, por UPDATE direto por paciente_id (não encadeando
      // tentarExcluirSessao sessão por sessão) — ver research.md, Decisão 11.
      const { error: erroSessoes } = await supabase
        .from('sessoes')
        .update({ excluida: true })
        .eq('paciente_id', id);
      if (erroSessoes) throw new Error('Não foi possível excluir o paciente.');

      const { error: erroLancamentos } = await supabase
        .from('lancamentos')
        .update({ excluido: true })
        .eq('paciente_id', id);
      if (erroLancamentos) throw new Error('Não foi possível excluir o paciente.');

      const { error: erroNotas } = await supabase.from('notas').update({ excluida: true }).eq('paciente_id', id);
      if (erroNotas) throw new Error('Não foi possível excluir o paciente.');

      const { data, error } = await supabase.from('pacientes').update({ excluido: true }).eq('id', id).select('id');
      if (error) throw new Error('Não foi possível excluir o paciente.');
      // update() sem .select() não reporta erro quando 0 linhas são afetadas (ex.: RLS
      // bloqueando silenciosamente); .select('id') nos deixa detectar esse caso aqui.
      if (!data || data.length === 0) throw new Error('Não foi possível excluir o paciente.');

      setPacientes((prev) => prev.filter((p) => p.id !== id));
      setSessoes((prev) => prev.filter((s) => s.pacienteId !== id));
      setLancamentos((prev) => prev.filter((l) => l.pacienteId !== id));
      setNotas((prev) => prev.filter((n) => n.pacienteId !== id));
    },
    [exigirConexao],
  );

  const agendarSessao = useCallback(
    async (input: NovaSessaoInput): Promise<void> => {
      exigirConexao();
      if (!usuario) throw new Error('Sessão inválida.');
      const total = input.repetirSemanal ? 4 : 1;
      const linhas = Array.from({ length: total }, (_, i) => ({
        psicologa_id: usuario.id,
        paciente_id: input.pacienteId,
        data: addDays(input.data, 7 * i),
        hora: input.hora,
        status: 'confirmada' as StatusSessao,
        modalidade: input.modalidade,
        valor: input.valor,
        duracao_min: 50,
      }));
      const { data, error } = await supabase.from('sessoes').insert(linhas).select('*');
      if (error || !data) throw new Error('Não foi possível agendar a sessão.');
      const novas = (data as LinhaSessao[]).map(deSessao);
      setSessoes((prev) => [...prev, ...novas]);
    },
    [usuario, exigirConexao],
  );

  const registrarSessao = useCallback(
    async (input: RegistroSessaoInput): Promise<void> => {
      exigirConexao();
      if (!usuario) throw new Error('Sessão inválida.');
      const p = pacientes.find((x) => x.id === input.pacienteId);
      if (!p) throw new Error('Paciente não encontrado.');
      const status: StatusSessao =
        input.presenca === 'compareceu' ? 'realizada' : input.presenca === 'faltou' ? 'faltou' : 'remarcada';

      let sessao = input.sessaoId ? sessoes.find((s) => s.id === input.sessaoId) : undefined;
      if (sessao) {
        const { data, error } = await supabase
          .from('sessoes')
          .update({ status })
          .eq('id', sessao.id)
          .select('*')
          .single();
        if (error || !data) throw new Error('Não foi possível registrar a sessão.');
        sessao = deSessao(data as LinhaSessao);
        setSessoes((prev) => prev.map((s) => (s.id === sessao!.id ? sessao! : s)));
      } else {
        const { data, error } = await supabase
          .from('sessoes')
          .insert({
            psicologa_id: usuario.id,
            paciente_id: p.id,
            data: toISO(new Date()),
            hora: p.horaFixa,
            status,
            modalidade: p.modalidade,
            valor: p.valorSessao,
            duracao_min: 50,
          })
          .select('*')
          .single();
        if (error || !data) throw new Error('Não foi possível registrar a sessão.');
        sessao = deSessao(data as LinhaSessao);
        setSessoes((prev) => [...prev, sessao!]);
      }

      const base = sessao;

      // Financeiro: só gera cobrança quando o paciente compareceu.
      const lancamentoAnterior = lancamentos.find((l) => l.sessaoId === base.id);
      if (lancamentoAnterior && status !== 'realizada') {
        const { error } = await supabase.from('lancamentos').delete().eq('id', lancamentoAnterior.id);
        if (error) throw new Error('Não foi possível atualizar o financeiro da sessão.');
        setLancamentos((prev) => prev.filter((l) => l.id !== lancamentoAnterior.id));
      } else if (status === 'realizada') {
        if (lancamentoAnterior) {
          const { data, error } = await supabase
            .from('lancamentos')
            .update({ pago: input.pago, metodo: input.pago ? input.metodo : null })
            .eq('id', lancamentoAnterior.id)
            .select('*')
            .single();
          if (error || !data) throw new Error('Não foi possível atualizar o financeiro da sessão.');
          const atualizado = deLancamento(data as LinhaLancamento);
          setLancamentos((prev) => prev.map((l) => (l.id === atualizado.id ? atualizado : l)));
        } else {
          const { data, error } = await supabase
            .from('lancamentos')
            .insert({
              psicologa_id: usuario.id,
              paciente_id: p.id,
              sessao_id: base.id,
              data: base.data,
              valor: base.valor,
              pago: input.pago,
              metodo: input.pago ? input.metodo : null,
            })
            .select('*')
            .single();
          if (error || !data) throw new Error('Não foi possível registrar o financeiro da sessão.');
          const novo = deLancamento(data as LinhaLancamento);
          setLancamentos((prev) => [...prev, novo]);
        }
      }

      const texto = input.nota.trim();
      if (texto) {
        // Uma nota já excluída (História 7) nunca é reativada/sobrescrita por uma
        // edição posterior — só notas ativas contam como "a nota da sessão"
        // (FR-004; ver research.md, Decisão 3).
        const notaExistente = notas.find((n) => n.sessaoId === base.id && !n.excluida);
        if (notaExistente) {
          const { data, error } = await supabase
            .from('notas')
            .update({ texto })
            .eq('id', notaExistente.id)
            .select('*')
            .single();
          if (error || !data) throw new Error('Não foi possível atualizar a anotação da sessão.');
          const atualizada = deNota(data as LinhaNota);
          setNotas((prev) => prev.map((n) => (n.id === atualizada.id ? atualizada : n)));
        } else {
          const { data, error } = await supabase
            .from('notas')
            .insert({ psicologa_id: usuario.id, paciente_id: p.id, sessao_id: base.id, data: base.data, texto })
            .select('*')
            .single();
          if (error || !data) throw new Error('Não foi possível salvar a anotação da sessão.');
          setNotas((prev) => [...prev, deNota(data as LinhaNota)]);
        }
      }
    },
    [usuario, pacientes, sessoes, lancamentos, notas, exigirConexao],
  );

  const confirmarSessao = useCallback(
    async (sessaoId: string): Promise<void> => {
      exigirConexao();
      const { data, error } = await supabase
        .from('sessoes')
        .update({ status: 'confirmada' })
        .eq('id', sessaoId)
        .select('*')
        .single();
      if (error || !data) throw new Error('Não foi possível confirmar a sessão.');
      const atualizada = deSessao(data as LinhaSessao);
      setSessoes((prev) => prev.map((s) => (s.id === sessaoId ? atualizada : s)));
    },
    [exigirConexao],
  );

  const tentarExcluirSessao = useCallback(
    async (sessaoId: string): Promise<void> => {
      // Exclusão lógica em cascata: marca nota(s) ativa(s) e lançamento(s) vinculados
      // como excluídos antes de marcar a própria sessão, nunca apagando nada de fato
      // (Princípio III) — ver research.md, Decisão 9.
      const notasAtivasDaSessao = notas.filter((n) => n.sessaoId === sessaoId && !n.excluida);
      if (notasAtivasDaSessao.length > 0) {
        const { data, error } = await supabase
          .from('notas')
          .update({ excluida: true })
          .eq('sessao_id', sessaoId)
          .eq('excluida', false)
          .select('id');
        if (error || !data || data.length === 0) throw new Error('Não foi possível excluir a sessão.');
        setNotas((prev) => prev.map((n) => (n.sessaoId === sessaoId && !n.excluida ? { ...n, excluida: true } : n)));
      }

      const { data: lancData, error: lancError } = await supabase
        .from('lancamentos')
        .update({ excluido: true })
        .eq('sessao_id', sessaoId)
        .select('id');
      if (lancError) throw new Error('Não foi possível excluir a sessão.');
      if (lancData && lancData.length > 0) {
        setLancamentos((prev) => prev.filter((l) => l.sessaoId !== sessaoId));
      }

      const { data, error } = await supabase
        .from('sessoes')
        .update({ excluida: true })
        .eq('id', sessaoId)
        .select('id');
      if (error) throw new Error('Não foi possível excluir a sessão.');
      // update() sem .select() não reporta erro quando 0 linhas são afetadas (ex.: RLS
      // bloqueando silenciosamente); .select('id') nos deixa detectar esse caso aqui.
      if (!data || data.length === 0) throw new Error('Não foi possível excluir a sessão.');
      setSessoes((prev) => prev.filter((s) => s.id !== sessaoId));
    },
    [notas],
  );

  const excluirSessao = useCallback(
    async (sessaoId: string): Promise<void> => {
      exigirConexao();
      await tentarExcluirSessao(sessaoId);
    },
    [tentarExcluirSessao, exigirConexao],
  );

  const excluirSessoesEmLote = useCallback(
    async (sessaoIds: string[]): Promise<{ excluidas: string[]; naoProcessadas: string[] }> => {
      exigirConexao();
      const excluidas: string[] = [];
      for (let i = 0; i < sessaoIds.length; i++) {
        const id = sessaoIds[i];
        try {
          await tentarExcluirSessao(id);
          excluidas.push(id);
        } catch {
          return { excluidas, naoProcessadas: sessaoIds.slice(i) };
        }
      }
      return { excluidas, naoProcessadas: [] };
    },
    [tentarExcluirSessao, exigirConexao],
  );

  const cobrar = useCallback(
    async (lancamentoId: string): Promise<void> => {
      exigirConexao();
      const { data, error } = await supabase
        .from('lancamentos')
        .update({ cobrado: true })
        .eq('id', lancamentoId)
        .select('*')
        .single();
      if (error || !data) throw new Error('Não foi possível registrar o lembrete de cobrança.');
      const atualizado = deLancamento(data as LinhaLancamento);
      setLancamentos((prev) => prev.map((l) => (l.id === lancamentoId ? atualizado : l)));
    },
    [exigirConexao],
  );

  const marcarComoPago = useCallback(
    async (lancamentoId: string, metodo: MetodoPagamento): Promise<void> => {
      exigirConexao();
      const { data, error } = await supabase
        .from('lancamentos')
        .update({ pago: true, metodo })
        .eq('id', lancamentoId)
        .select('*')
        .single();
      if (error || !data) throw new Error('Não foi possível marcar o lançamento como pago.');
      const atualizado = deLancamento(data as LinhaLancamento);
      setLancamentos((prev) => prev.map((l) => (l.id === lancamentoId ? atualizado : l)));
    },
    [exigirConexao],
  );

  const tentarRemoverLancamento = useCallback(async (lancamentoId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('lancamentos')
      .update({ excluido: true })
      .eq('id', lancamentoId)
      .select('id');
    if (error) throw new Error('Não foi possível remover o lançamento.');
    // update() sem .select() não reporta erro quando 0 linhas são afetadas (ex.: RLS
    // bloqueando silenciosamente); .select('id') nos deixa detectar esse caso aqui.
    if (!data || data.length === 0) throw new Error('Não foi possível remover o lançamento.');
    setLancamentos((prev) => prev.filter((l) => l.id !== lancamentoId));
  }, []);

  const removerLancamento = useCallback(
    async (lancamentoId: string): Promise<void> => {
      exigirConexao();
      await tentarRemoverLancamento(lancamentoId);
    },
    [tentarRemoverLancamento, exigirConexao],
  );

  const removerLancamentosEmLote = useCallback(
    async (lancamentoIds: string[]): Promise<{ removidos: string[]; naoProcessados: string[] }> => {
      exigirConexao();
      const removidos: string[] = [];
      for (let i = 0; i < lancamentoIds.length; i++) {
        const id = lancamentoIds[i];
        try {
          await tentarRemoverLancamento(id);
          removidos.push(id);
        } catch {
          return { removidos, naoProcessados: lancamentoIds.slice(i) };
        }
      }
      return { removidos, naoProcessados: [] };
    },
    [tentarRemoverLancamento, exigirConexao],
  );

  const excluirNota = useCallback(
    async (notaId: string): Promise<void> => {
      exigirConexao();
      const { data, error } = await supabase.from('notas').update({ excluida: true }).eq('id', notaId).select('id');
      if (error) throw new Error('Não foi possível excluir a anotação.');
      // update() sem .select() não reporta erro quando 0 linhas são afetadas (ex.: RLS
      // bloqueando silenciosamente); .select('id') nos deixa detectar esse caso aqui.
      if (!data || data.length === 0) throw new Error('Não foi possível excluir a anotação.');
      setNotas((prev) => prev.filter((n) => n.id !== notaId));
    },
    [exigirConexao],
  );

  const value = useMemo<AppState>(
    () => ({
      hoje: toISO(new Date()),
      pacientes,
      sessoes,
      lancamentos,
      notas,
      toast,
      carregando,
      paciente,
      showToast,
      criarPaciente,
      editarPaciente,
      excluirPaciente,
      agendarSessao,
      registrarSessao,
      confirmarSessao,
      excluirSessao,
      excluirSessoesEmLote,
      cobrar,
      marcarComoPago,
      removerLancamento,
      removerLancamentosEmLote,
      excluirNota,
    }),
    [
      pacientes,
      sessoes,
      lancamentos,
      notas,
      toast,
      carregando,
      paciente,
      showToast,
      criarPaciente,
      editarPaciente,
      excluirPaciente,
      agendarSessao,
      registrarSessao,
      confirmarSessao,
      excluirSessao,
      excluirSessoesEmLote,
      cobrar,
      marcarComoPago,
      removerLancamento,
      removerLancamentosEmLote,
      excluirNota,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp precisa estar dentro de <AppProvider>');
  return ctx;
}
