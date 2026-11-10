import { Text, View } from 'react-native';
import type { PredictiveModel } from '../../types/api';
import { colors } from '../../utils/theme';
import { BarChart, formatDate, Panel, RiskBadge, Stat } from './OverviewUI';

export function PredictionPanel({ model }: { model: PredictiveModel | null }) {
  return (
    <Panel title="Pronóstico de las próximas 4 semanas" subtitle="Estimación calculada por el modelo del backend; no representa casos confirmados.">
      {model ? (
        <>
          <RiskBadge risk={model.riskLevel} />
          <BarChart data={[
            { label: 'Sem 1', value: model.projectedWeek1 },
            { label: 'Sem 2', value: model.projectedWeek2 },
            { label: 'Sem 3', value: model.projectedWeek3 },
            { label: 'Sem 4', value: model.projectedWeek4 },
          ]} color="#0284C7" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Stat label="Promedio histórico" value={model.historicalAverage.toFixed(1)} />
            <Stat label="Promedio reciente" value={model.recentAverage.toFixed(1)} />
            <Stat label="Confianza (backend)" value={`${(model.confidenceLevel * 100).toFixed(0)} %`} note="Puntaje calculado por el servidor" />
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Generado el {formatDate(model.generatedAt)}. La predicción no equivale a un diagnóstico ni a una alerta oficial.</Text>
        </>
      ) : <Text style={{ color: colors.textMuted }}>Todavía no existe una predicción para este distrito.</Text>}
    </Panel>
  );
}
