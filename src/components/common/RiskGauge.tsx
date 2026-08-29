import { classNames } from '@/utils/helpers';
import type { RiskLevel } from '@/types';
import { riskColors } from '@/utils/helpers';

export default function RiskGauge({ score, level, size = 180 }: { score: number; level: RiskLevel; size?: number }) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const c = riskColors[level];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={classNames(c.text)}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={classNames('text-4xl font-bold tracking-tight', c.text)}>{score}</span>
        <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mt-1">RISK SCORE</span>
      </div>
    </div>
  );
}
