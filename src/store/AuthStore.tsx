import { isAuthError, type Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Na web, o link de recuperação precisa ser uma URL http(s) real (a própria origem
 * servida pelo Metro); o scheme customizado (psico://) só é resolvido de forma
 * confiável em uma development/standalone build — no Expo Go ele não é garantido
 * (Expo Go usa o esquema exp://). Ver research.md, Decisão 3.
 */
function urlDeRedefinicaoDeSenha(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/redefinir-senha`;
  }
  return 'psico://redefinir-senha';
}

export interface Usuario {
  id: string;
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
  /** true até a sessão persistida (se houver) terminar de ser restaurada na abertura do app. */
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: CadastroInput) => Promise<void>;
  sair: () => void;
  solicitarRecuperacaoSenha: (email: string) => Promise<void>;
  redefinirSenha: (novaSenha: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function usuarioDaSessao(session: Session | null): Usuario | null {
  const user = session?.user;
  if (!user?.email) return null;
  const meta = (user.user_metadata ?? {}) as { nome?: string; crp?: string; celular?: string };
  return {
    id: user.id,
    email: user.email,
    nome: meta.nome ?? '',
    crp: meta.crp || undefined,
    celular: meta.celular || undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(usuarioDaSessao(data.session));
      setCarregando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(usuarioDaSessao(session));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (!error) return;
    if (isAuthError(error) && error.status === undefined) {
      throw new Error('Não foi possível conectar. Verifique sua internet e tente novamente.');
    }
    // Mensagem genérica: não revela se o problema foi o e-mail ou a senha.
    throw new Error('E-mail ou senha incorretos.');
  }, []);

  const cadastrar = useCallback(async (dados: CadastroInput) => {
    const { error } = await supabase.auth.signUp({
      email: dados.email.trim(),
      password: dados.senha,
      options: {
        data: {
          nome: dados.nome.trim(),
          crp: dados.crp?.trim() || undefined,
          celular: dados.celular?.trim() || undefined,
        },
      },
    });
    if (!error) return;
    if (isAuthError(error) && error.status === undefined) {
      throw new Error('Não foi possível conectar. Verifique sua internet e tente novamente.');
    }
    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
      throw new Error('Esse e-mail já está em uso.');
    }
    throw new Error('Não foi possível criar a conta.');
  }, []);

  const sair = useCallback(() => {
    void supabase.auth.signOut();
  }, []);

  const solicitarRecuperacaoSenha = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: urlDeRedefinicaoDeSenha(),
    });
    if (error && isAuthError(error) && error.status === undefined) {
      throw new Error('Não foi possível conectar. Verifique sua internet e tente novamente.');
    }
    // Nenhum outro erro é propagado: a confirmação de envio é idêntica para e-mails
    // com ou sem conta cadastrada (FR-006), para não revelar quais e-mails existem.
  }, []);

  const redefinirSenha = useCallback(async (novaSenha: string) => {
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (!error) return;
    if (isAuthError(error) && error.status === undefined) {
      throw new Error('Não foi possível conectar. Verifique sua internet e tente novamente.');
    }
    throw new Error('O link de redefinição expirou ou já foi usado. Solicite uma nova recuperação de senha.');
  }, []);

  const value = useMemo(
    () => ({ usuario, carregando, entrar, cadastrar, sair, solicitarRecuperacaoSenha, redefinirSenha }),
    [usuario, carregando, entrar, cadastrar, sair, solicitarRecuperacaoSenha, redefinirSenha],
  );
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
