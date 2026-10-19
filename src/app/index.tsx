import { Redirect } from 'expo-router';

import { useAuth } from '@/store/AuthStore';

/** Rota inicial: manda para o app ou para o login conforme a sessão. */
export default function Index() {
  const { usuario } = useAuth();
  return <Redirect href={usuario ? '/inicio' : '/login'} />;
}
