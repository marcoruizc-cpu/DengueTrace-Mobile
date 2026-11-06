import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { userService } from '../services/userService';
import { useAuth } from './useAuth';

/** Token FCM nativo (lo que espera el backend con Firebase Admin). null si no se puede obtener. */
export async function registerForPushAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null; // en el navegador no hay push nativo
  // Expo Go no entrega el token nativo de FCM: solo funciona en un build de EAS.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  if (!Device.isDevice) return null; // emulador: sin push

  const current = await Notifications.getPermissionsAsync();
  const finalStatus = current.status === 'granted' ? 'granted' : (await Notifications.requestPermissionsAsync()).status;
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alertas de dengue',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { data } = await Notifications.getDevicePushTokenAsync();
  return typeof data === 'string' ? data : null;
}

/** Una vez por sesión: obtiene el token y lo guarda en el backend con PATCH /users/me. */
export function usePushRegistration() {
  const { status, setUser } = useAuth();

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    const register = async () => {
      try {
        const fcmToken = await registerForPushAsync();
        if (!fcmToken || cancelled) return;
        const updated = await userService.updateMe({ fcmToken });
        if (!cancelled) setUser(updated); // ahora user.pushRegistered = true
      } catch {
        // Sin google-services.json o sin permiso: la app sigue funcionando sin push.
      }
    };
    void register();
    return () => {
      cancelled = true;
    };
  }, [status, setUser]);
}
