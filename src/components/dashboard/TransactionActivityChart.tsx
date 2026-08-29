import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getTransactions } from '@/services/fraudService';
import type { Transaction } from '@/types';

export default function TransactionActivityChart() {
  const [range, setRange] = useState<'7' | '30' | '90'>('7');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    getTransactions().then(setTransactions);
  }, []);

  const data = useMemo(() => {
    const days = parseInt(range, 10);
    const result: { date: string; total: number; fraud: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayTxns = transactions.filter(t => t.date === dateStr);
      const total = dayTxns.length;
      const fraud = dayTxns.filter(t => t.prediction === 'Fraud' || t.prediction === 'Suspicious').length;

      result.push({ date: displayDate, total, fraud });
    }
    return result;
  }, [transactions, range]);

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-end mb-6">
        <div className="flex gap-1 bg-background rounded-lg p-1 border border-border">
          {(['7', '30', '90'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                range === r ? 'bg-surface text-text-primary shadow-sm border border-border/50' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {r} Days
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: -20, right: 10, top: 5 }}>
          <defs>
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C7E8" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#00C7E8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#202630" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#8B95A5', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
          <YAxis tick={{ fill: '#8B95A5', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
          <Tooltip 
            contentStyle={{ background: '#10141B', border: '1px solid #202630', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            labelStyle={{ color: '#F5F7FA', fontWeight: 600, marginBottom: '4px' }}
            itemStyle={{ fontSize: '13px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#8B95A5', paddingTop: '20px' }} iconType="circle" iconSize={8} />
          <Area type="monotone" dataKey="total" stroke="#00C7E8" strokeWidth={2} fill="url(#totalGrad)" name="Total Transactions" />
          <Area type="monotone" dataKey="fraud" stroke="#EF4444" strokeWidth={2} fill="url(#fraudGrad)" name="Fraud Transactions" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
