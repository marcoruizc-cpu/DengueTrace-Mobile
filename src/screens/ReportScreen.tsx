import * as Location from 'expo-location';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { toAppError } from '../api/errors';
import { DistrictPicker } from '../components/DistrictPicker';
import { Message, Panel, formatDate } from '../components/analytics/OverviewUI';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { districtService } from '../services/districtService';
import { reportService } from '../services/reportService';
import type { Symptom } from '../types/api';
import { serializeSymptoms, SYMPTOM_LABELS } from '../utils/constants';
import { colors } from '../utils/theme';

type Coordinates = { latitude: number; longitude: number };
const OPTIONS = Object.keys(SYMPTOM_LABELS) as Symptom[];

export default function ReportScreen() {
  const { user } = useAuth();
  const districts = useFetch(signal => districtService.getAll(signal), []);
  const reports = useFetch(signal => reportService.getMine(signal), []);
  const [districtId, setDistrictId] = useState<number | null>(user?.districtId ?? null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (symptom: Symptom) => {
    setSymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
    setMessage(null);
  };

  const locate = async () => {
    setGettingLocation(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Permiso de ubicación rechazado. Puedes enviar tu reporte solo con el distrito.');
        return;
      }
      const { coords: position } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: position.latitude, longitude: position.longitude });
    } catch {
      setError('No se pudo obtener tu ubicación. Puedes reportar indicando tu distrito.');
    } finally {
      setGettingLocation(false);
    }
  };

  const submit = async () => {
    setMessage(null);
    setError(null);
    if (districtId == null) { setError('Selecciona el distrito donde presentas los síntomas.'); return; }
    if (!symptoms.length) { setError('Selecciona al menos un síntoma.'); return; }
    setSending(true);
    try {
      const result = await reportService.create({
        districtId,
        symptoms: serializeSymptoms(symptoms),
        ...(coords ?? {}),
      });
      setMessage(`Reporte #${result.id} enviado correctamente.`);
      setSymptoms([]);
      setCoords(null);
      reports.reload();
    } catch (err) {
      setError(toAppError(err).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.title}>Autorreporte de síntomas</Text>
      <Text style={s.muted}>Comparte señales de posible dengue para apoyar la vigilancia. Este formulario no reemplaza una evaluación médica.</Text>
      <Panel title="1. Ubicación del reporte">
        {districts.error ? <Message text={districts.error.message} action="Reintentar" onAction={districts.reload} /> : null}
        <DistrictPicker label="Distrito donde presentas los síntomas" value={districtId} onChange={setDistrictId} districts={districts.data} loading={districts.loading} />
        <PrimaryButton title={coords ? 'Actualizar ubicación GPS' : 'Adjuntar ubicación GPS (opcional)'} onPress={() => void locate()} loading={gettingLocation} variant="secondary" />
        <Text style={s.muted}>Solo se solicita permiso al tocar el botón. La ubicación exacta se enviará con el reporte si la adjuntas.</Text>
        {coords ? <View style={s.location}><Text style={s.muted}>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</Text><Pressable accessibilityRole="button" onPress={() => setCoords(null)}><Text style={s.remove}>Quitar GPS</Text></Pressable></View> : null}
      </Panel>
      <Panel title="2. Selecciona tus síntomas">
        {OPTIONS.map(symptom => (
          <Pressable key={symptom} accessibilityRole="checkbox" accessibilityState={{ checked: symptoms.includes(symptom) }} onPress={() => toggle(symptom)} style={[s.option, symptoms.includes(symptom) && s.checked]}>
            <Text style={s.checkbox}>{symptoms.includes(symptom) ? '☑' : '☐'}</Text>
            <Text style={s.optionText}>{SYMPTOM_LABELS[symptom]}</Text>
          </Pressable>
        ))}
        <Text style={s.warning}>Si presentas sangrado, dolor abdominal intenso, vómitos persistentes o deterioro general, busca atención médica de inmediato.</Text>
      </Panel>
      {error ? <Message text={error} /> : null}
      {message ? <Message text={message} /> : null}
      <PrimaryButton title="Enviar autorreporte" onPress={() => void submit()} loading={sending} disabled={districtId == null || symptoms.length === 0} />
      <Panel title="Mis reportes recientes">
        {reports.loading ? <Text style={s.muted}>Cargando reportes…</Text> : reports.error ? <Message text={reports.error.message} action="Reintentar" onAction={reports.reload} /> : reports.data?.length ? [...reports.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(report => (
          <View key={report.id} style={s.historyItem}>
            <Text style={s.optionText}>{report.districtName ?? `Distrito #${report.districtId}`}</Text>
            <Text style={s.muted}>#{report.id} · {formatDate(report.createdAt)}</Text>
          </View>
        )) : <Text style={s.muted}>Todavía no tienes autorreportes.</Text>}
      </Panel>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, paddingBottom: 36, gap: 14, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  muted: { color: colors.textMuted, lineHeight: 19, fontSize: 13 },
  option: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  checked: { backgroundColor: colors.primarySoft, borderColor: '#7DD3FC' },
  checkbox: { fontSize: 22, color: colors.primary },
  optionText: { fontWeight: '600', color: colors.text, flexShrink: 1 },
  warning: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10, color: '#92400E', lineHeight: 20 },
  location: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  remove: { color: colors.danger, fontWeight: '700' },
  historyItem: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: 4 },
});
