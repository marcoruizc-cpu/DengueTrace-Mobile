import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Message, Panel } from '../analytics/OverviewUI';
import { PrimaryButton } from '../PrimaryButton';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { colors } from '../../utils/theme';

/** Evidencia de lectura del segundo sensor solicitado en la Fase 2. */
export function MotionSensorPanel() {
  const sensor = useAccelerometer();
  // Al cambiar de pestaña detenemos el sensor para ahorrar batería.
  useFocusEffect(useCallback(() => () => sensor.stop(), [sensor.stop]));
  const reading = sensor.sample;
  const magnitude = reading ? Math.hypot(reading.x, reading.y, reading.z) : null;

  return (
    <Panel title="3. Acelerómetro" subtitle="Demostración del segundo sensor del teléfono">
      <Text style={styles.muted}>Inicia la lectura para ver la aceleración de cada eje en tiempo real. Los datos no se guardan ni se incluyen en tu autorreporte.</Text>
      <View style={styles.values}>
        {(['x', 'y', 'z'] as const).map(axis => (
          <View key={axis} style={styles.axis}>
            <Text style={styles.axisLabel}>Eje {axis.toUpperCase()}</Text>
            <Text style={styles.axisValue}>{reading ? reading[axis].toFixed(2) : '—'} g</Text>
          </View>
        ))}
      </View>
      <Text style={styles.muted}>Magnitud total: {magnitude === null ? '—' : magnitude.toFixed(2)} g</Text>
      {sensor.error ? <Message text={sensor.error} /> : null}
      {sensor.state === 'active' ? (
        <PrimaryButton title="Detener acelerómetro" variant="secondary" onPress={sensor.stop} />
      ) : (
        <PrimaryButton title="Iniciar acelerómetro" onPress={() => void sensor.start()} loading={sensor.state === 'starting'} />
      )}
      <Text style={styles.note}>1 g ≈ 9,81 m/s². El acelerómetro mide el movimiento del teléfono, no síntomas ni riesgo de dengue.</Text>
    </Panel>
  );
}
const styles = StyleSheet.create({
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  values: { flexDirection: 'row', gap: 8 },
  axis: { flex: 1, minWidth: 0, backgroundColor: colors.primarySoft, padding: 10, borderRadius: 10 },
  axisLabel: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  axisValue: { color: colors.text, fontWeight: '800', fontSize: 17, marginTop: 5 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
