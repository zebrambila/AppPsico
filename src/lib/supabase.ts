import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

import { secureStorage } from './secureStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY (ver .env.example).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    // O link de recuperação de senha é tratado manualmente pela rota redefinir-senha
    // (verifyOtp), não pela detecção automática de sessão na URL do próprio Supabase.
    detectSessionInUrl: false,
  },
});
