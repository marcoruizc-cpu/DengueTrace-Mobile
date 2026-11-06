import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';

/** Franja que aparece arriba cuando el celular pierde internet. */
export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <SafeAreaView edges={['top']} style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>Sin conexión: mostrando los últimos datos cargados</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.warning, paddingVertical: 6, paddingHorizontal: 12 },
  text: { color: '#FFFFFF', textAlign: 'center', fontSize: 13 },
});
