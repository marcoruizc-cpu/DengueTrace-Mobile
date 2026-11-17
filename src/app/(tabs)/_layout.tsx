import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View, type ColorValue } from 'react-native';
import { OfflineBanner } from '../../components/OfflineBanner';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { usePushRegistration } from '../../hooks/usePushRegistration';
import { colors } from '../../utils/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

const tabIcon = (name: IoniconName) =>
  function IconoPestana({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={typeof color === 'number' ? colors.primary : color ?? undefined} size={size} />;
  };

export default function TabsLayout() {
  const isOnline = useNetworkStatus();
  usePushRegistration(); // registra el token FCM una vez por sesión (solo en builds de EAS)

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner visible={!isOnline} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          headerTitleAlign: 'center',
          // con el banner visible, el banner ya ocupa el espacio de la barra de estado
          headerStatusBarHeight: isOnline ? undefined : 0,
        }}
      >
        <Tabs.Screen name="panel" options={{ title: 'Panel', href: Platform.OS === 'web' ? null : undefined, tabBarIcon: tabIcon('grid-outline') }} />
        <Tabs.Screen name="index" options={{ title: Platform.OS === 'web' ? 'Panel' : 'Mapa', tabBarIcon: tabIcon(Platform.OS === 'web' ? 'grid-outline' : 'map-outline') }} />
        <Tabs.Screen name="web-map" options={{ title: 'Mapa', href: Platform.OS === 'web' ? '/web-map' : null, tabBarIcon: tabIcon('map-outline') }} />
        <Tabs.Screen name="dashboard" options={{ title: 'Panel', href: Platform.OS === 'web' ? null : ('/dashboard' as any), tabBarIcon: tabIcon('grid-outline') }} />
        <Tabs.Screen name="alerts" options={{ title: 'Alertas', tabBarIcon: tabIcon('notifications-outline') }} />
        <Tabs.Screen name="model" options={{ title: 'Modelo', tabBarIcon: tabIcon('stats-chart-outline') }} />
        <Tabs.Screen name="report" options={{ title: 'Reporte', tabBarIcon: tabIcon('medkit-outline') }} />
        <Tabs.Screen name="news" options={{ title: 'Noticias', tabBarIcon: tabIcon('newspaper-outline') }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: tabIcon('person-outline') }} />
      </Tabs>
    </View>
  );
}
