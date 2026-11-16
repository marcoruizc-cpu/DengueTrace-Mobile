import * as Notifications from 'expo-notifications';
import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { LoadingView } from '../components/LoadingView';
import { AuthProvider } from '../contexts/AuthProvider';
import { useAuth } from '../hooks/useAuth';

// Cómo se muestra una notificación que llega con la app abierta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function RootNavigator() {
  const { status } = useAuth();
  const router = useRouter();
  const navigationReady = Boolean(useRootNavigationState()?.key);

  useEffect(() => {
    if (Platform.OS === 'web' || status !== 'authenticated' || !navigationReady) return;

    const openAlerts = () => {
      router.navigate('/alerts');
      Notifications.clearLastNotificationResponse();
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(openAlerts);
    if (Notifications.getLastNotificationResponse()) openAlerts();
    return () => subscription.remove();
  }, [navigationReady, router, status]);

  if (status === 'checking') return <LoadingView message="Cargando tu sesión…" />;
  const signedIn = status === 'authenticated';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="district/[id]" options={{ headerShown: true, title: 'Distrito', headerBackTitle: 'Volver' }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <Toast />
    </AuthProvider>
  );
}
