import type { ReactNode } from 'react';
import { classNames } from '@/utils/helpers';

interface KPICardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'critical';
  trend?: number;
}

export default function KPICard({ label, value, icon, accent = 'primary', trend }: KPICardProps) {
  const accents: Record<string, string> = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    accent: 'text-primary',
    critical: 'text-danger',
  };

  return (
    <div className="card card-hover p-5 animate-fade-in-up">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</p>
        <div className={classNames('shrink-0', accents[accent] || accents.primary)}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
        {trend !== undefined && (
          <span className={classNames('text-xs font-semibold', trend >= 0 ? 'text-success' : 'text-danger')}>
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>
    </div>
  );
}
