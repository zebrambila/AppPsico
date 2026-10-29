import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toast } from '@/components/Toast';
import { AppProvider } from '@/store/AppStore';
import { AuthProvider, useAuth } from '@/store/AuthStore';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/** Só libera o splash e a navegação quando fontes e sessão persistida já resolveram. */
function AppShell() {
  const { carregando } = useAuth();
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const pronto = (loaded || !!error) && !carregando;

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  if (!pronto) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <RootNavigator />
      <Toast />
    </View>
  );
}

/** Rotas protegidas: sem usuário só o grupo (auth) fica acessível; com usuário, só o app. */
function RootNavigator() {
  const { usuario } = useAuth();
  const logado = !!usuario;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      {/* Fora de qualquer Stack.Protected: verifyOtp autentica temporariamente a usuária
          antes de ela definir a nova senha, então o grupo guardado por !logado a esconderia. */}
      <Stack.Screen name="redefinir-senha" />
      <Stack.Protected guard={!logado}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={logado}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paciente/novo" />
        <Stack.Screen name="paciente/[id]" />
        <Stack.Screen name="paciente/[id]/editar" />
        <Stack.Screen name="sessao/registrar" />
        <Stack.Screen
          name="sessao/nova"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.92],
            sheetGrabberVisible: true,
            sheetCornerRadius: 24,
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}
