import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Storage adapter para a sessão do Supabase: expo-secure-store (criptografado) em
 * iOS/Android, com fallback para AsyncStorage apenas na web, onde o SecureStore não
 * está disponível.
 */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return Platform.OS === 'web' ? await AsyncStorage.getItem(key) : await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') await AsyncStorage.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch {
      // Falha de escrita (ex.: payload grande em versões antigas do iOS) não deve
      // travar o login; a sessão simplesmente não persiste entre aberturas do app.
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') await AsyncStorage.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch {
      // Idem: remoção best-effort.
    }
  },
};
