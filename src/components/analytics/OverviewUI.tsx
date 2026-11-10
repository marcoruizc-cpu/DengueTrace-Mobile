import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RiskLevel } from '../../types/api';
import { RISK_META } from '../../utils/constants';
import { colors } from '../../utils/theme';

export function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <View style={s.panel}>
      <Text style={s.heading}>{title}</Text>
      {subtitle ? <Text style={s.muted}>{subtitle}</Text> : null}
      <View style={s.content}>{children}</View>
    </View>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel | null | undefined }) {
  const value = risk ? RISK_META[risk] : null;
  return (
    <View style={[s.badge, { backgroundColor: value ? `${value.color}22` : '#E2E8F0' }]}>
      <View style={[s.dot, { backgroundColor: value?.color ?? colors.textMuted }]} />
      <Text style={[s.badgeLabel, { color: risk === 'LOW' ? colors.text : value?.color ?? colors.textMuted }]}>
        {value?.label ?? 'Sin clasificación'}
      </Text>
    </View>
  );
}

export function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
      {note ? <Text style={s.statNote}>{note}</Text> : null}
    </View>
  );
}

export interface ChartPoint { label: string; value: number }

export function BarChart({ data, color = '#0EA5E9', empty = 'No hay datos para mostrar.' }: {
  data: ChartPoint[]; color?: string; empty?: string;
}) {
  if (!data.length) return <Text style={s.muted}>{empty}</Text>;
  const points = data.slice(-12);
  const maximum = Math.max(1, ...points.map(x => Number.isFinite(x.value) ? x.value : 0));
  return (
    <View>
      <View style={s.chart}>
        {points.map((point, index) => (
          <View key={`${point.label}-${index}`} style={s.chartCol}>
            <Text style={s.chartValue}>{Math.round(point.value)}</Text>
            <View style={s.barTrack}>
              <View style={[s.bar, { backgroundColor: color, height: `${Math.max(2, Math.min(100, point.value / maximum * 100))}%` as `${number}%` }]} />
            </View>
            <Text style={s.chartLabel} numberOfLines={1}>{point.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function Message({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <View style={s.message}>
      <Text style={s.muted}>{text}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={s.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

const s = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  heading: { fontSize: 18, fontWeight: '800', color: colors.text },
  muted: { color: colors.textMuted, lineHeight: 20 },
  content: { marginTop: 10, gap: 12 },
  stat: { flexGrow: 1, flexBasis: 140, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, gap: 4 },
  statLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  statNote: { fontSize: 12, color: colors.textMuted },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 25, gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 9 },
  badgeLabel: { fontSize: 12, fontWeight: '700' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 185 },
  chartCol: { flex: 1, alignItems: 'center', minWidth: 0 },
  barTrack: { width: '85%', height: 135, backgroundColor: '#F1F5F9', justifyContent: 'flex-end', borderRadius: 5, overflow: 'hidden' },
  bar: { width: '100%', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  chartValue: { fontSize: 10, color: colors.textMuted, marginBottom: 3 },
  chartLabel: { fontSize: 9, color: colors.textMuted, marginTop: 5, width: '100%', textAlign: 'center' },
  message: { padding: 12, backgroundColor: colors.primarySoft, borderRadius: 10, gap: 6 },
  action: { color: colors.primary, fontWeight: '800' },
});
