import type { RiskLevel, Symptom } from '../types/api';

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  HIGH_FEVER: 'Fiebre alta (>38°C)',
  HEADACHE: 'Dolor de cabeza intenso',
  MUSCLE_JOINT_PAIN: 'Dolor muscular/articular',
  RASH: 'Sarpullido (rash)',
  BLEEDING_GUMS_OR_NOSE: 'Sangrado de encías o nariz (signo de alarma)',
};

export const RISK_META: Record<RiskLevel, { label: string; color: string }> = {
  LOW: { label: 'Bajo', color: '#16A34A' },
  MEDIUM: { label: 'Medio', color: '#F59E0B' },
  HIGH: { label: 'Alto', color: '#DC2626' },
  CRITICAL: { label: 'Muy alto', color: '#7F1D1D' },
};

export const serializeSymptoms = (symptoms: Symptom[]) => symptoms.join(',');

const isSymptomCode = (value: string): value is Symptom => Object.hasOwn(SYMPTOM_LABELS, value);

export function formatReportedSymptoms(raw: string): string {
  if (!raw.trim()) return 'Síntomas enviados';

  const codes = raw.split(',').map(value => value.trim());
  if (codes.every(isSymptomCode)) {
    return codes.map(code => SYMPTOM_LABELS[code]).join(' · ');
  }

  return raw.split(/([,\r\n])/).map(part => {
    const value = part.trim();
    return isSymptomCode(value) ? part.replace(value, SYMPTOM_LABELS[value]) : part;
  }).join('');
}
