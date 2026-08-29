import { riskDistribution } from '@/data/mockData';
import { formatNumber } from '@/utils/helpers';

export default function RiskOverview() {
  return (
    <div className="card p-5 animate-fade-in-up">
      <h3 className="text-base font-semibold text-ink-100">Risk Overview</h3>
      <p className="text-xs text-ink-400 mt-0.5 mb-4">Distribution of risk levels across transactions</p>
      <div className="space-y-4">
        {riskDistribution.map(r => (
          <div key={r.level}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                <span className="text-sm text-ink-200">{r.level} Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink-100">{formatNumber(r.count)}</span>
                <span className="text-xs text-ink-400">{r.percentage}%</span>
              </div>
            </div>
            <div className="w-full h-2 bg-ink-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.percentage}%`, background: r.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
