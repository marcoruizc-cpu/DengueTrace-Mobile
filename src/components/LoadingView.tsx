import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/theme';

export function LoadingView({ message }: { message?: string }) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message ?? 'Cargando'}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  text: { color: colors.textMuted },
});
