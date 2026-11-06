import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** true mientras haya internet; NetInfo avisa cada vez que cambia. */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(
    () => NetInfo.addEventListener(state => setIsOnline(!!state.isConnected && state.isInternetReachable !== false)),
    [],
  );
  return isOnline;
}
