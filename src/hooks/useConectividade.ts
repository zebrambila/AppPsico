import { useNetworkState } from 'expo-network';

/** true quando há conexão com a internet utilizável; false quando ela está ausente ou inalcançável. */
export function useConectividade(): boolean {
  const { isConnected, isInternetReachable } = useNetworkState();
  return isConnected !== false && isInternetReachable !== false;
}
