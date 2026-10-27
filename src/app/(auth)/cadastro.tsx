import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { FormField } from '@/components/FormField';
import { NOME_APP } from '@/components/Logo';
import { BackButton, Button, Row, Txt } from '@/components/ui';
import { CORES_FORCA, forcaDaSenha } from '@/lib/forcaSenha';
import { emailValido, useAuth } from '@/store/AuthStore';
import { useApp } from '@/store/AppStore';
import { colors } from '@/theme';

export default function Cadastro() {
  const { cadastrar } = useAuth();
  const { showToast } = useApp();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [crp, setCrp] = useState('');
  const [celular, setCelular] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [termos, setTermos] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const validos = {
    nome: nome.trim().length > 1,
    email: emailValido(email),
    senha: senha.length >= 8,
    confirmacao: confirmacao.length > 0 && confirmacao === senha,
    termos,
  };
  const erro = (campo: keyof typeof validos, msg: string) => tentou && !validos[campo] && msg;
  const forca = forcaDaSenha(senha);

  const onCriar = async () => {
    setTentou(true);
    if (!Object.values(validos).every(Boolean)) return;
    setEnviando(true);
    try {
      await cadastrar({ nome, email, crp, celular, senha });
      showToast(`Conta criada! Bem-vinda ao ${NOME_APP}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Não foi possível criar a conta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthScreen>
      <BackButton />
      <View style={{ gap: 8 }}>
        <Txt accessibilityRole="header" size={28} weight="extrabold" style={{ letterSpacing: -0.5 }}>
          Criar sua conta
        </Txt>
        <Txt size={15} color={colors.muted} style={{ lineHeight: 22 }}>
          Leva um minuto. Depois você cadastra seus pacientes e horários.
        </Txt>
      </View>

      <View style={{ gap: 14 }}>
        <FormField
          label="Nome completo"
          value={nome}
          onChangeText={setNome}
          placeholder="Como aparece no seu registro"
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          error={erro('nome', 'Informe seu nome.')}
        />
        <FormField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={erro('email', 'Informe um e-mail válido.')}
        />
        <Row style={{ gap: 10, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <FormField label="CRP" optional value={crp} onChangeText={setCrp} placeholder="00/00000" autoCapitalize="none" />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label="Celular"
              optional
              value={celular}
              onChangeText={setCelular}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
          </View>
        </Row>
        <View style={{ gap: 8 }}>
          <FormField
            label="Senha"
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
                style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: i <= forca.nivel ? CORES_FORCA[forca.nivel] : CORES_FORCA[0] }}
              />
            ))}
          </Row>
          <Txt size={12} weight="semibold" color={forca.cor}>
            {forca.label}
          </Txt>
        </View>
        <FormField
          label="Confirmar senha"
          value={confirmacao}
          onChangeText={setConfirmacao}
          placeholder="Repita a senha"
          password
          autoComplete="new-password"
          textContentType="newPassword"
          error={erro('confirmacao', 'As senhas não coincidem.')}
        />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termos }}
          onPress={() => setTermos((v) => !v)}
          style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', minHeight: 44 }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 1.5,
              borderColor: termos ? colors.primary : tentou && !termos ? colors.dangerInk : colors.handle,
              backgroundColor: termos ? colors.primary : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
            }}
          >
            {termos ? <Feather name="check" size={14} color={colors.white} /> : null}
          </View>
          <Txt size={13} color={colors.inkSoft} style={{ flex: 1, lineHeight: 20 }}>
            Li e aceito os{' '}
            <Txt size={13} weight="semibold" color={colors.primary} onPress={() => Linking.openURL('https://example.com/termos')}>
              Termos de uso
            </Txt>{' '}
            e a{' '}
            <Txt size={13} weight="semibold" color={colors.primary} onPress={() => Linking.openURL('https://example.com/privacidade')}>
              Política de privacidade
            </Txt>
            , incluindo o tratamento de dados conforme a LGPD.
          </Txt>
        </Pressable>
        {tentou && !termos ? (
          <Txt size={12} weight="semibold" color={colors.dangerInk} style={{ marginTop: -8 }}>
            É preciso aceitar os termos para continuar.
          </Txt>
        ) : null}
      </View>

      <Button label={enviando ? 'Criando conta…' : 'Criar conta'} size="lg" onPress={onCriar} />

      <Row style={{ justifyContent: 'center', gap: 4 }}>
        <Txt size={14} color={colors.muted}>
          Já tem conta?
        </Txt>
        <Pressable
          accessibilityRole="button"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}
        >
          <Txt size={14} weight="bold" color={colors.primary}>
            Entrar
          </Txt>
        </Pressable>
      </Row>
    </AuthScreen>
  );
}
