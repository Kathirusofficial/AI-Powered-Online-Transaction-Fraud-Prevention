import type { ReactNode } from 'react';
import { classNames, predictionColors, riskColors } from '@/utils/helpers';
import type { Prediction, RiskLevel } from '@/types';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'info' | 'critical';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-surface text-text-secondary border-border',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    primary: 'bg-primary/10 text-primary border-primary/20',
    info: 'bg-primary/10 text-primary border-primary/20',
    critical: 'bg-danger/10 text-danger border-danger/20',
  };
  return (
    <span className={classNames('inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded border', variants[variant] || variants.default, className)}>
      {children}
    </span>
  );
}

export function PredictionBadge({ prediction }: { prediction: Prediction }) {
  const variant = prediction === 'Fraud' ? 'danger' : prediction === 'Suspicious' ? 'warning' : 'success';
  const dotColor = prediction === 'Fraud' ? 'bg-danger' : prediction === 'Suspicious' ? 'bg-warning' : 'bg-success';
  return <Badge variant={variant}><span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />{prediction}</Badge>;
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const variant = level === 'Critical' ? 'danger' : level === 'High' ? 'danger' : level === 'Medium' ? 'warning' : 'success';
  const dotColor = level === 'Critical' || level === 'High' ? 'bg-danger' : level === 'Medium' ? 'bg-warning' : 'bg-success';
  return <Badge variant={variant}><span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />{level} Risk</Badge>;
}
