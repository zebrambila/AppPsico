import { Alert, Platform } from 'react-native';

/**
 * `Alert.alert` do react-native-web é um no-op (não existe diálogo nativo no
 * navegador), então confirmações de ações destrutivas (excluir sessão/paciente,
 * remover lançamento) silenciosamente não faziam nada ao testar na Web. Esta função
 * usa `Alert.alert` normal em iOS/Android e cai para `window.confirm` na Web.
 */
export function confirmarAcao({
  titulo,
  mensagem,
  labelConfirmar,
  destrutivo = true,
  onConfirmar,
}: {
  titulo: string;
  mensagem: string;
  labelConfirmar: string;
  destrutivo?: boolean;
  onConfirmar: () => void;
}): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${titulo}\n\n${mensagem}`)) {
      onConfirmar();
    }
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: labelConfirmar, style: destrutivo ? 'destructive' : 'default', onPress: onConfirmar },
  ]);
}
