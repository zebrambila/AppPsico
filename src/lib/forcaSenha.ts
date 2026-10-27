import { colors } from '@/theme';

export function forcaDaSenha(senha: string): { nivel: 0 | 1 | 2 | 3; label: string; cor: string } {
  if (!senha) return { nivel: 0, label: 'Use letras e números', cor: colors.muted };
  if (senha.length < 8) return { nivel: 1, label: 'Muito curta', cor: colors.dangerInk };
  let pts = 1;
  if (/[0-9]/.test(senha) && /[a-zA-Z]/.test(senha)) pts++;
  if (senha.length >= 12 || /[^a-zA-Z0-9]/.test(senha)) pts++;
  if (pts >= 3) return { nivel: 3, label: 'Senha forte', cor: colors.primaryInk };
  if (pts === 2) return { nivel: 2, label: 'Senha razoável', cor: colors.warnInk };
  return { nivel: 1, label: 'Senha fraca', cor: colors.dangerInk };
}

export const CORES_FORCA = ['#E9E6DF', '#B5543F', '#B07A1E', colors.primary];
