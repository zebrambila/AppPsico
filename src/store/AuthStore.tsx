import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface Usuario {
  nome: string;
  email: string;
  /** registro no Conselho Regional de Psicologia — opcional */
  crp?: string;
  celular?: string;
}

export interface CadastroInput {
  nome: string;
  email: string;
  crp?: string;
  celular?: string;
  senha: string;
}

interface AuthState {
  usuario: Usuario | null;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: CadastroInput) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Conta de demonstração usada quando o e-mail não foi cadastrado nesta sessão. */
const CONTA_DEMO: Usuario = { nome: 'Marina Santos', email: 'marina@consultorio.com', crp: '06/123456' };

/**
 * Autenticação SIMULADA, só em memória, para o protótipo.
 * Troque por um provedor real (Supabase Auth, Firebase Auth, sua API…) antes de publicar:
 * nunca guarde senhas no app.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [contas, setContas] = useState<Usuario[]>([CONTA_DEMO]);

  const entrar = useCallback(
    async (email: string, senha: string) => {
      if (!email || !senha) throw new Error('Informe e-mail e senha.');
      const conta = contas.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
      setUsuario(conta ?? { ...CONTA_DEMO, email: email.trim() });
    },
    [contas],
  );

  const cadastrar = useCallback(async ({ senha: _senha, ...dados }: CadastroInput) => {
    const novo: Usuario = {
      nome: dados.nome.trim(),
      email: dados.email.trim(),
      crp: dados.crp?.trim() || undefined,
      celular: dados.celular?.trim() || undefined,
    };
    setContas((prev) => [...prev.filter((c) => c.email !== novo.email), novo]);
    setUsuario(novo);
  }, []);

  const sair = useCallback(() => setUsuario(null), []);

  const value = useMemo(() => ({ usuario, entrar, cadastrar, sair }), [usuario, entrar, cadastrar, sair]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}

export function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
