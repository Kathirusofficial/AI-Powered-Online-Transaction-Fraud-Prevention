import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getTransactions } from '@/services/fraudService';
import type { Transaction } from '@/types';
import { formatNumber } from '@/utils/helpers';

export default function FraudDistributionChart() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    getTransactions().then(setTransactions);
  }, []);

  const genuine = transactions.filter(t => t.prediction === 'Genuine').length;
  const suspicious = transactions.filter(t => t.prediction === 'Suspicious').length;
  const fraud = transactions.filter(t => t.prediction === 'Fraud').length;
  const total = transactions.length;

  const data = [
    { name: 'Genuine', value: genuine, color: '#00C7E8' },
    { name: 'Suspicious', value: suspicious, color: '#F59E0B' },
    { name: 'Fraud', value: fraud, color: '#EF4444' },
  ];

  const centerLabel = formatNumber(total);

  return (
    <div className="animate-fade-in-up h-full flex flex-col justify-center">
      <div className="relative mb-6">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} stroke="none">
              {data.map(d => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#10141B', border: '1px solid #202630', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
              labelStyle={{ color: '#F5F7FA' }} 
              itemStyle={{ fontSize: '13px', color: '#F5F7FA' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-text-primary">{centerLabel}</span>
          <span className="text-xs font-medium text-text-secondary uppercase tracking-widest mt-1">TOTAL</span>
        </div>
      </div>
      <div className="space-y-3 px-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
              <span className="text-sm font-medium text-text-secondary">{d.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-primary font-medium">{formatNumber(d.value)}</span>
              <span className="text-xs font-mono text-text-secondary/70 w-10 text-right">{total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
