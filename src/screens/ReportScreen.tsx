import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { toAppError } from '../api/errors';
import { DistrictPicker } from '../components/DistrictPicker';
import { Message, Panel, formatDate } from '../components/analytics/OverviewUI';
import { PrimaryButton } from '../components/PrimaryButton';
import { MotionSensorPanel } from '../components/sensors/MotionSensorPanel';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { useReportLocation } from '../hooks/useReportLocation';
import { districtService } from '../services/districtService';
import { reportService } from '../services/reportService';
import type { Symptom } from '../types/api';
import { serializeSymptoms, SYMPTOM_LABELS, parseSymptoms } from '../utils/constants';
import { colors } from '../utils/theme';

const OPTIONS = Object.keys(SYMPTOM_LABELS) as Symptom[];

export default function ReportScreen() {
  const { user } = useAuth();
  const districts = useFetch(signal => districtService.getAll(signal), []);
  const reports = useFetch(signal => reportService.getMine(signal), []);
  const [districtId, setDistrictId] = useState<number | null>(user?.districtId ?? null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const gps = useReportLocation();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cuando termina de hidratarse la sesión, selecciona el distrito habitual solo si existe en la API.
  useEffect(() => {
    if (districtId == null && user?.districtId != null && districts.data?.some(d => d.id === user.districtId)) {
      setDistrictId(user.districtId);
    }
  }, [user?.districtId, districtId, districts.data]);

  const selectedDistrict = districts.data?.find(d => d.id === districtId);
  const toggle = (symptom: Symptom) => {
    setSymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
    setMessage(null);
  };
  const submit = async () => {
    if (sending) return;
    setMessage(null);
    setError(null);
    if (!selectedDistrict || districts.loading) {
      setError('Selecciona un distrito registrado para enviar el autorreporte.');
      return;
    }
    if (symptoms.length === 0) {
      setError('Selecciona al menos un síntoma.');
      return;
    }
    setSending(true);
    try {
      const result = await reportService.create({
        districtId: selectedDistrict.id,
        symptoms: serializeSymptoms(symptoms),
        ...(gps.coordinates ? {
          latitude: gps.coordinates.latitude,
          longitude: gps.coordinates.longitude,
        } : {}),
      });
      setMessage(`Reporte #${result.id} enviado correctamente.`);
      setSymptoms([]);
      gps.clear();
      reports.reload();
    } catch (err) {
      setError(toAppError(err).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Autorreporte de síntomas</Text>
      <Text style={s.muted}>Comunica posibles síntomas para apoyar la vigilancia. Este formulario no es un diagnóstico ni reemplaza atención médica.</Text>

      <Panel title="1. Distrito y ubicación GPS">
        {districts.error ? <Message text={districts.error.message} action="Reintentar" onAction={districts.reload} /> : null}
        {!districts.loading && districts.data?.length === 0 ? (
          <Message text="El servidor todavía no tiene distritos registrados. Actualiza la lista para enviar tu reporte." action="Actualizar distritos" onAction={districts.reload} />
        ) : null}
        <DistrictPicker label="Distrito donde presentas los síntomas" value={districtId} onChange={setDistrictId} districts={districts.data} loading={districts.loading} emptyLabel="Seleccionar distrito" />
        <PrimaryButton title={gps.coordinates ? 'Actualizar ubicación GPS' : 'Adjuntar ubicación GPS (opcional)'} onPress={() => void gps.locate()} loading={gps.loading} variant="secondary" />
        <Text style={s.muted}>Pedimos permiso únicamente al pulsar el botón. Si adjuntas el GPS, la latitud y longitud se enviarán junto con tu reporte. Verifica el distrito manualmente.</Text>
        {gps.error ? <Message text={gps.error} /> : null}
        {gps.coordinates ? (
          <View style={s.location}>
            <View style={{ flex: 1 }}>
              <Text style={s.coords}>{gps.coordinates.latitude.toFixed(5)}, {gps.coordinates.longitude.toFixed(5)}</Text>
              {gps.coordinates.accuracy != null ? <Text style={s.muted}>Precisión aproximada: {Math.round(gps.coordinates.accuracy)} m</Text> : null}
            </View>
            <Pressable accessibilityRole="button" onPress={gps.clear}><Text style={s.remove}>Quitar GPS</Text></Pressable>
          </View>
        ) : null}
      </Panel>

      <Panel title="2. Selecciona tus síntomas">
        {OPTIONS.map(symptom => (
          <Pressable key={symptom} accessibilityRole="checkbox" accessibilityState={{ checked: symptoms.includes(symptom) }} onPress={() => toggle(symptom)} style={[s.option, symptoms.includes(symptom) && s.checked]}>
            <Text style={s.checkbox}>{symptoms.includes(symptom) ? '☑' : '☐'}</Text>
            <Text style={s.optionText}>{SYMPTOM_LABELS[symptom]}</Text>
          </Pressable>
        ))}
        <Text style={s.warning}>Ante señales de alarma, como sangrado o dolor abdominal intenso, busca atención médica de inmediato.</Text>
      </Panel>

      {error ? <Message text={error} /> : null}
      {message ? <Message text={message} /> : null}
      <PrimaryButton title="Enviar autorreporte" onPress={() => void submit()} loading={sending} disabled={!selectedDistrict || districts.loading || symptoms.length === 0} />

      <MotionSensorPanel />

      <Panel title="Mis reportes recientes">
        {reports.loading ? <Text style={s.muted}>Cargando reportes…</Text> : reports.error ? (
          <Message text={reports.error.message} action="Reintentar" onAction={reports.reload} />
        ) : reports.data?.length ? (
          [...reports.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(report => (
            <View key={report.id} style={s.historyItem}>
              <Text style={s.optionText}>{report.districtName ?? `Distrito #${report.districtId}`}</Text>
              <Text style={s.muted}>Reporte #{report.id} · {formatDate(report.createdAt)}</Text>
              <Text style={s.muted}>{parseSymptoms(report.symptoms).map(symptom => SYMPTOM_LABELS[symptom]).join(' · ') || 'Síntomas enviados'}</Text>
            </View>
          ))
        ) : <Text style={s.muted}>Todavía no tienes autorreportes.</Text>}
        <PrimaryButton title="Actualizar mis reportes" variant="secondary" onPress={reports.reload} disabled={reports.loading} />
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
  location: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: 10 },
  coords: { fontWeight: '700', color: colors.text, marginBottom: 3 },
  remove: { color: colors.danger, fontWeight: '700' },
  historyItem: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: 4 },
});
