import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Message, Panel, BarChart, RiskBadge, Stat, formatDate } from '../components/analytics/OverviewUI';
import { PredictionPanel } from '../components/analytics/PredictionPanel';
import { WeatherPanel } from '../components/analytics/WeatherPanel';
import { useFetch } from '../hooks/useFetch';
import { alertService } from '../services/alertService';
import { climateService } from '../services/climateService';
import { districtService } from '../services/districtService';
import { historicalCaseService } from '../services/historicalCaseService';
import { predictiveService } from '../services/predictiveService';
import { colors } from '../utils/theme';

export default function DistrictScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const districtId = Number(id);
  const valid = Number.isSafeInteger(districtId) && districtId > 0;
  const district = useFetch(signal => valid ? districtService.getById(districtId, signal) : Promise.resolve(null), [districtId]);
  const cases = useFetch(signal => valid ? historicalCaseService.getByDistrict(districtId, signal) : Promise.resolve([]), [districtId]);
  const forecast = useFetch(signal => valid ? predictiveService.getLatest(districtId, signal) : Promise.resolve(null), [districtId]);
  const alerts = useFetch(signal => valid ? alertService.getByDistrict(districtId, signal) : Promise.resolve([]), [districtId]);
  const climate = useFetch(signal => valid ? climateService.getByDistrict(districtId, signal) : Promise.resolve([]), [districtId]);

  if (!valid) return <View style={s.page}><Message text="El identificador del distrito no es válido." /></View>;

  const history = [...(cases.data ?? [])].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate))
    .slice(-12).map(d => ({ label: d.weekStartDate.slice(5), value: d.caseCount }));
  const active = (alerts.data ?? []).filter(a => a.active);
  const latestClimate = [...(climate.data ?? [])].sort((a, b) => b.recordedDate.localeCompare(a.recordedDate))[0];
  const latestCases = history.at(-1)?.value;

  return (
    <ScrollView contentContainerStyle={s.page}>
      {district.error ? <Message text={district.error.message} action="Reintentar" onAction={district.reload} /> : null}
      {district.loading ? <Text>Cargando distrito…</Text> : null}
      <Text style={s.title}>{district.data?.name ?? 'Detalle del distrito'}</Text>
      <Text style={s.subtitle}>{[district.data?.province, district.data?.department].filter(Boolean).join(' · ')}</Text>
      {district.data ? (
        <View style={s.metrics}>
          <Stat label="Población" value={district.data.population?.toLocaleString('es-PE') ?? 'Sin datos'} />
          <Stat label="Casos última semana registrada" value={latestCases ?? 'Sin datos'} />
          <Stat label="Alertas activas" value={active.length} />
        </View>
      ) : null}
      <Panel title="Evolución de casos" subtitle="Historial semanal reportado en el backend; no es una serie en tiempo real.">
        {cases.loading ? <Text>Cargando…</Text> : cases.error ? <Message text={cases.error.message} action="Reintentar" onAction={cases.reload} /> : <BarChart data={history} />}
      </Panel>
      {forecast.error ? <Message text={`Predicción: ${forecast.error.message}`} action="Reintentar" onAction={forecast.reload} /> : null}
      {!forecast.loading && !forecast.error ? <PredictionPanel model={forecast.data} /> : null}
      <Panel title="Alertas del distrito">
        {alerts.loading ? <Text>Cargando alertas…</Text> : alerts.error ? <Message text={alerts.error.message} action="Reintentar" onAction={alerts.reload} /> : active.length ? active.map(a => (
          <View key={a.id} style={s.alert}>
            <RiskBadge risk={a.riskLevel} />
            <Text style={s.alertText}>{a.message}</Text>
            <Text style={s.subtitle}>{formatDate(a.createdAt)}</Text>
          </View>
        )) : <Text style={s.subtitle}>No hay alertas activas registradas para este distrito.</Text>}
      </Panel>
      <Panel title="Último clima almacenado en el servidor">
        {climate.loading ? <Text>Cargando…</Text> : climate.error ? <Message text={climate.error.message} action="Reintentar" onAction={climate.reload} /> : latestClimate ? (
          <View style={s.metrics}>
            <Stat label="Temperatura" value={`${latestClimate.temperature} °C`} />
            <Stat label="Humedad" value={`${latestClimate.humidity} %`} />
            <Stat label="Lluvia" value={`${latestClimate.precipitationMm} mm`} note={formatDate(latestClimate.recordedDate)} />
          </View>
        ) : <Text style={s.subtitle}>No hay datos climáticos guardados.</Text>}
      </Panel>
      {district.data ? <WeatherPanel district={district.data} /> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, paddingBottom: 40, gap: 14, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textMuted, lineHeight: 19 },
  metrics: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  alert: { padding: 10, backgroundColor: '#F8FAFC', borderRadius: 10, gap: 6 },
  alertText: { color: colors.text, lineHeight: 20 },
});
