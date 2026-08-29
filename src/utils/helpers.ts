import type { Prediction, RiskLevel } from '@/types';

export const riskColors: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
  Low: { bg: 'bg-success-500/10', text: 'text-success-500', border: 'border-success-500/30', dot: 'bg-success-500' },
  Medium: { bg: 'bg-warning-500/10', text: 'text-warning-500', border: 'border-warning-500/30', dot: 'bg-warning-500' },
  High: { bg: 'bg-danger-500/10', text: 'text-danger-500', border: 'border-danger-500/30', dot: 'bg-danger-500' },
  Critical: { bg: 'bg-critical-500/10', text: 'text-critical-400', border: 'border-critical-500/30', dot: 'bg-critical-500' },
};

export const predictionColors: Record<Prediction, { bg: string; text: string; border: string }> = {
  Genuine: { bg: 'bg-success-500/10', text: 'text-success-500', border: 'border-success-500/30' },
  Suspicious: { bg: 'bg-warning-500/10', text: 'text-warning-500', border: 'border-warning-500/30' },
  Fraud: { bg: 'bg-critical-500/10', text: 'text-critical-400', border: 'border-critical-500/30' },
};

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

export function getPrediction(score: number): Prediction {
  if (score >= 80) return 'Fraud';
  if (score >= 40) return 'Suspicious';
  return 'Genuine';
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPercent(n: number, digits = 2): string {
  return n.toFixed(digits) + '%';
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
