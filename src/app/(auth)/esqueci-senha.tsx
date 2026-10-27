import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { FormField } from '@/components/FormField';
import { BackButton, Button, Txt } from '@/components/ui';
import { useApp } from '@/store/AppStore';
import { emailValido, useAuth } from '@/store/AuthStore';
import { colors } from '@/theme';

export default function EsqueciSenha() {
  const { solicitarRecuperacaoSenha } = useAuth();
  const { showToast } = useApp();
  const [email, setEmail] = useState('');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const erroEmail = tentou && !emailValido(email) && 'Informe um e-mail válido.';

  const onEnviar = async () => {
    setTentou(true);
    if (!emailValido(email)) return;
    setEnviando(true);
    try {
      await solicitarRecuperacaoSenha(email);
      setEnviado(true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Não foi possível enviar as instruções.');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <AuthScreen>
        <BackButton />
        <View style={{ gap: 8, paddingTop: 24 }}>
          <Txt accessibilityRole="header" size={26} weight="extrabold" style={{ letterSpacing: -0.5 }}>
            Verifique seu e-mail
          </Txt>
          <Txt size={15} color={colors.muted} style={{ lineHeight: 22 }}>
            Se {email.trim()} tiver uma conta cadastrada, enviamos um link para você
            definir uma nova senha. Abra o e-mail e toque no link para continuar.
          </Txt>
        </View>
        <Button label="Voltar para o login" size="lg" variant="outline" onPress={() => router.replace('/login')} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <BackButton />
      <View style={{ gap: 8, paddingTop: 16 }}>
        <Txt accessibilityRole="header" size={26} weight="extrabold" style={{ letterSpacing: -0.5 }}>
          Esqueceu sua senha?
        </Txt>
        <Txt size={15} color={colors.muted} style={{ lineHeight: 22 }}>
          Informe o e-mail da sua conta e enviaremos um link para você definir uma nova
          senha.
        </Txt>
      </View>

      <FormField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={erroEmail}
        onSubmitEditing={onEnviar}
        returnKeyType="send"
      />

      <Button label={enviando ? 'Enviando…' : 'Enviar link'} size="lg" onPress={onEnviar} />
    </AuthScreen>
  );
}
