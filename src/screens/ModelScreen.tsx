import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { toAppError } from '../api/errors';
import { DistrictPicker } from '../components/DistrictPicker';
import { Message, Panel, BarChart } from '../components/analytics/OverviewUI';
import { PredictionPanel } from '../components/analytics/PredictionPanel';
import { WeatherPanel } from '../components/analytics/WeatherPanel';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { districtService } from '../services/districtService';
import { historicalCaseService } from '../services/historicalCaseService';
import { predictiveService } from '../services/predictiveService';
import { colors } from '../utils/theme';

export default function ModelScreen() {
  const { user } = useAuth();
  const canGenerate = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const districts = useFetch(signal => districtService.getAll(signal), []);
  const [chosenDistrictId, setDistrictId] = useState<number | null>(user?.districtId ?? null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<{ districtId: number; message: string } | null>(null);
  const districtId = chosenDistrictId ?? districts.data?.[0]?.id ?? null;
  const forecast = useFetch(signal => districtId == null ? Promise.resolve(null) : predictiveService.getLatest(districtId, signal), [districtId]);
  const cases = useFetch(signal => districtId == null ? Promise.resolve([]) : historicalCaseService.getByDistrict(districtId, signal), [districtId]);
  const selected = districts.data?.find(d => d.id === districtId);
  const history = [...(cases.data ?? [])].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate))
    .slice(-10).map(d => ({ label: d.weekStartDate.slice(5), value: d.caseCount }));

  const generate = async () => {
    if (districtId == null || generating || !canGenerate) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      await predictiveService.generate(districtId);
      forecast.reload();
    } catch (error) {
      setGenerateError({ districtId, message: toAppError(error).message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.title}>Modelo predictivo</Text>
      <Text style={s.muted}>Consulta proyecciones del servidor para un distrito. Las condiciones meteorológicas se muestran por separado.</Text>
      {districts.error ? <Message text={districts.error.message} action="Reintentar" onAction={districts.reload} /> : null}
      <DistrictPicker label="Distrito a analizar" value={districtId} onChange={id => { setDistrictId(id); setGenerateError(null); }} districts={districts.data} loading={districts.loading} />
      {forecast.loading ? <Text style={s.muted}>Consultando predicción…</Text> : null}
      {forecast.error ? <Message text={forecast.error.message} action="Reintentar" onAction={forecast.reload} /> : null}
      {!forecast.loading && !forecast.error && districtId != null ? <PredictionPanel model={forecast.data} /> : null}
      {generateError && generateError.districtId === districtId ? <Message text={generateError.message} /> : null}
      {canGenerate ? (
        <PrimaryButton title="Generar / actualizar predicción" onPress={() => void generate()} disabled={districtId == null} loading={generating} />
      ) : (
        <Text style={s.note}>Solo administradores y moderadores pueden generar predicciones. Puedes consultar las existentes.</Text>
      )}
      <Text style={s.note}>La generación exige al menos cuatro semanas de casos históricos. Los datos climáticos externos son informativos y no modifican la predicción automáticamente.</Text>
      <Panel title="Casos históricos registrados" subtitle="Últimas diez semanas disponibles en el servidor">
        {cases.loading ? <Text>Cargando historial…</Text> : cases.error ? <Message text={cases.error.message} action="Reintentar" onAction={cases.reload} /> : <BarChart data={history} />}
      </Panel>
      {selected ? <WeatherPanel district={selected} /> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, paddingBottom: 32, gap: 14, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  muted: { color: colors.textMuted, lineHeight: 20 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
