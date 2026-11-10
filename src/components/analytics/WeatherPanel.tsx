import { useFetch } from '../../hooks/useFetch';
import { weatherService } from '../../services/weatherService';
import type { District } from '../../types/api';
import { Message, Panel, Stat } from './OverviewUI';
import { Text, View } from 'react-native';
import { colors } from '../../utils/theme';

export function WeatherPanel({ district }: { district: District | null | undefined }) {
  const lat = district?.latitude ?? null;
  const lon = district?.longitude ?? null;
  const weather = useFetch(signal => {
    if (lat == null || lon == null) return Promise.resolve(null);
    return weatherService.getCurrent(lat, lon, signal);
  }, [lat, lon]);

  return (
    <Panel title="Clima actual · Open-Meteo" subtitle={district ? district.name : 'Selecciona un distrito'}>
      {lat == null || lon == null ? <Message text="El distrito no tiene coordenadas registradas." /> : null}
      {lat != null && lon != null && weather.loading ? <Text>Cargando clima externo…</Text> : null}
      {weather.error ? <Message text={weather.error.message} action="Reintentar" onAction={weather.reload} /> : null}
      {!weather.loading && weather.data ? (
        <>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Stat label="Temperatura" value={`${weather.data.temperature.toFixed(1)} °C`} />
            <Stat label="Humedad" value={`${weather.data.humidity.toFixed(0)} %`} />
            <Stat label="Precipitación" value={`${weather.data.precipitationMm.toFixed(1)} mm`} />
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Hora reportada: {weather.data.observedAt} (Lima). Datos meteorológicos estimados, no diagnóstico.</Text>
        </>
      ) : null}
    </Panel>
  );
}
