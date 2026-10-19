import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { FormField } from '@/components/FormField';
import { Logo } from '@/components/Logo';
import { Button, Row, Txt } from '@/components/ui';
import { emailValido, useAuth } from '@/store/AuthStore';
import { useApp } from '@/store/AppStore';
import { colors } from '@/theme';

export default function Login() {
  const { entrar } = useAuth();
  const { showToast } = useApp();
  // Pré-preenchido com a conta de demonstração para facilitar os testes.
  const [email, setEmail] = useState('marina@consultorio.com');
  const [senha, setSenha] = useState('senha1234');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const erroEmail = tentou && !emailValido(email) && 'Informe um e-mail válido.';
  const erroSenha = tentou && !senha && 'Informe sua senha.';

  const onEntrar = async () => {
    setTentou(true);
    if (!emailValido(email) || !senha) return;
    setEnviando(true);
    try {
      await entrar(email, senha);
      // O Stack.Protected do layout raiz leva automaticamente para as abas.
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthScreen>
      <View style={{ paddingTop: 40 }}>
        <Logo />
      </View>

      <View style={{ gap: 8, paddingTop: 24 }}>
        <Txt accessibilityRole="header" size={30} weight="extrabold" style={{ letterSpacing: -0.6, lineHeight: 36 }}>
          Bem-vinda de volta
        </Txt>
        <Txt size={15} color={colors.muted} style={{ lineHeight: 22 }}>
          Entre para ver sua agenda, seus pacientes e o financeiro do consultório.
        </Txt>
      </View>

      <View style={{ gap: 16 }}>
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
        />
        <FormField
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          placeholder="Sua senha"
          password
          autoComplete="current-password"
          textContentType="password"
          error={erroSenha}
          onSubmitEditing={onEntrar}
          returnKeyType="go"
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => showToast('Enviamos um link de redefinição para seu e-mail')}
          style={{ alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' }}
        >
          <Txt size={14} weight="semibold" color={colors.primary}>
            Esqueci minha senha
          </Txt>
        </Pressable>
      </View>

      <Button label={enviando ? 'Entrando…' : 'Entrar'} size="lg" onPress={onEntrar} />

      <View style={{ flex: 1 }} />

      <Row style={{ justifyContent: 'center', gap: 4 }}>
        <Txt size={14} color={colors.muted}>
          Ainda não tem conta?
        </Txt>
        <Pressable accessibilityRole="button" onPress={() => router.push('/cadastro')} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}>
          <Txt size={14} weight="bold" color={colors.primary}>
            Criar conta
          </Txt>
        </Pressable>
      </Row>
    </AuthScreen>
  );
}
