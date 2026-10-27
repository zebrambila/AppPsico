import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { FormField } from '@/components/FormField';
import { Button, Row, Txt } from '@/components/ui';
import { CORES_FORCA, forcaDaSenha } from '@/lib/forcaSenha';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/store/AppStore';
import { useAuth } from '@/store/AuthStore';
import { colors } from '@/theme';

type StatusLink = 'verificando' | 'valido' | 'invalido';

export default function RedefinirSenha() {
  const { redefinirSenha } = useAuth();
  const { showToast } = useApp();
  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>();

  const linkValido = !!params.token_hash && params.type === 'recovery';
  const [status, setStatus] = useState<StatusLink>(linkValido ? 'verificando' : 'invalido');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!linkValido) return;
    supabase.auth
      .verifyOtp({ token_hash: params.token_hash!, type: 'recovery' })
      .then(({ error }) => setStatus(error ? 'invalido' : 'valido'));
  }, [linkValido, params.token_hash]);

  const validos = {
    senha: senha.length >= 8,
    confirmacao: confirmacao.length > 0 && confirmacao === senha,
  };
  const erro = (campo: keyof typeof validos, msg: string) => tentou && !validos[campo] && msg;
  const forca = forcaDaSenha(senha);

  const onConfirmar = async () => {
    setTentou(true);
    if (!Object.values(validos).every(Boolean)) return;
    setEnviando(true);
    try {
      await redefinirSenha(senha);
      showToast('Senha redefinida com sucesso!');
      router.replace('/inicio');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Não foi possível redefinir a senha.');
    } finally {
      setEnviando(false);
    }
  };

  if (status === 'verificando') {
    return (
      <AuthScreen>
        <Txt style={{ paddingTop: 40 }} color={colors.muted}>
          Verificando link…
        </Txt>
      </AuthScreen>
    );
  }

  if (status === 'invalido') {
    return (
      <AuthScreen>
        <View style={{ gap: 8, paddingTop: 40 }}>
          <Txt accessibilityRole="header" size={26} weight="extrabold" style={{ letterSpacing: -0.5 }}>
            Link inválido ou expirado
          </Txt>
          <Txt size={15} color={colors.muted} style={{ lineHeight: 22 }}>
            Esse link de redefinição já foi usado ou não é mais válido. Solicite uma
            nova recuperação de senha.
          </Txt>
        </View>
        <Button label="Solicitar novo link" size="lg" onPress={() => router.replace('/esqueci-senha')} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <View style={{ gap: 8, paddingTop: 40 }}>
        <Txt accessibilityRole="header" size={26} weight="extrabold" style={{ letterSpacing: -0.5 }}>
          Definir nova senha
        </Txt>
        <Txt size={15} color={colors.muted} style={{ lineHeight: 22 }}>
          Escolha uma nova senha para sua conta.
        </Txt>
      </View>

      <View style={{ gap: 14 }}>
        <View style={{ gap: 8 }}>
          <FormField
            label="Nova senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="Mínimo de 8 caracteres"
            password
            autoComplete="new-password"
            textContentType="newPassword"
            error={erro('senha', 'A senha precisa ter pelo menos 8 caracteres.')}
          />
          <Row style={{ gap: 4 }} accessible accessibilityLabel={`Força da senha: ${forca.label}`}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: i <= forca.nivel ? CORES_FORCA[forca.nivel] : CORES_FORCA[0],
                }}
              />
            ))}
          </Row>
          <Txt size={12} weight="semibold" color={forca.cor}>
            {forca.label}
          </Txt>
        </View>
        <FormField
          label="Confirmar nova senha"
          value={confirmacao}
          onChangeText={setConfirmacao}
          placeholder="Repita a senha"
          password
          autoComplete="new-password"
          textContentType="newPassword"
          error={erro('confirmacao', 'As senhas não coincidem.')}
          onSubmitEditing={onConfirmar}
          returnKeyType="go"
        />
      </View>

      <Button label={enviando ? 'Salvando…' : 'Salvar nova senha'} size="lg" onPress={onConfirmar} />
    </AuthScreen>
  );
}
