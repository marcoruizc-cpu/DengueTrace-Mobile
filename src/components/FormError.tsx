import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/theme';

/** Error general de un formulario (lo que respondió el servidor). */
export function FormError({ message, details = [] }: { message: string | null; details?: string[] }) {
  if (!message) return null;
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.text}>{message}</Text>
      {details.map(detail => (
        <Text key={detail} style={styles.text}>
          • {detail}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 12, gap: 2 },
  text: { color: colors.danger },
});
