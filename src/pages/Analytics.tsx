import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getTransactions } from '@/services/fraudService';
import type { Transaction } from '@/types';
import { formatNumber } from '@/utils/helpers';

const tooltipStyle = { background: '#10141B', border: '1px solid #202630', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };
const axisProps = { tick: { fill: '#8B95A5', fontSize: 11 }, axisLine: false as const, tickLine: false as const };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Analytics() {
  const [range, setRange] = useState('6M');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    getTransactions().then(setTransactions);
  }, []);

  const monthlyStats = useMemo(() => {
    return MONTHS.map(month => {
      const monthTxns = transactions.filter(t => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return MONTHS[d.getMonth()] === month;
      });
      const fraud = monthTxns.filter(t => t.prediction === 'Fraud').length;
      const suspicious = monthTxns.filter(t => t.prediction === 'Suspicious').length;
      const volume = monthTxns.length;
      return { month, fraud, suspicious, volume };
    });
  }, [transactions]);

  const fraudTrendData = useMemo(() => {
    return range === '3M' ? monthlyStats.slice(-3) : range === '6M' ? monthlyStats.slice(-6) : monthlyStats;
  }, [monthlyStats, range]);

  const mappedRiskDist = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    transactions.forEach(t => {
      if (t.riskLevel in counts) counts[t.riskLevel]++;
    });
    return [
      { level: 'Low', count: counts.Low, color: '#22C55E' },
      { level: 'Medium', count: counts.Medium, color: '#F59E0B' },
      { level: 'High', count: counts.High, color: '#EF4444' },
      { level: 'Critical', count: counts.Critical, color: '#E11D48' },
    ];
  }, [transactions]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">ANALYTICS</h1>
          <p className="text-text-secondary mt-1">Deep dive into fraud patterns and transaction metrics.</p>
        </div>

        {/* Fraud Trend */}
        <div className="card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider border-b border-border pb-2 inline-block">Fraud Trend</h3>
              <p className="text-xs text-text-secondary mt-2">Fraud and suspicious activity over time</p>
            </div>
            <div className="flex gap-1 bg-background rounded-lg p-1 border border-border">
              {['3M', '6M', '1Y'].map(r => (
                <button 
                  key={r} 
                  onClick={() => setRange(r)} 
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${range === r ? 'bg-surface text-text-primary shadow-sm border border-border/50' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={fraudTrendData} margin={{ left: -20, right: 10, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#202630" vertical={false} />
              <XAxis dataKey="month" {...axisProps} dy={10} />
              <YAxis {...axisProps} dx={-10} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#F5F7FA', fontWeight: 600, marginBottom: '4px' }} itemStyle={{ fontSize: '13px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#8B95A5', paddingTop: '20px' }} iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="fraud" stroke="#EF4444" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#10141B' }} activeDot={{ r: 6 }} name="Fraud" />
              <Line type="monotone" dataKey="suspicious" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#10141B' }} activeDot={{ r: 6 }} name="Suspicious" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {/* Transaction Volume */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider border-b border-border pb-2 inline-block">Transaction Volume</h3>
            <p className="text-xs text-text-secondary mt-2 mb-8">Monthly transaction volume</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fraudTrendData} margin={{ left: -20, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#202630" vertical={false} />
                <XAxis dataKey="month" {...axisProps} dy={10} />
                <YAxis {...axisProps} dx={-10} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#F5F7FA', fontWeight: 600, marginBottom: '4px' }} itemStyle={{ fontSize: '13px' }} cursor={{ fill: '#202630', opacity: 0.4 }} />
                <Bar dataKey="volume" fill="#00C7E8" radius={[4, 4, 0, 0]} name="Volume" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider border-b border-border pb-2 inline-block">Risk Distribution</h3>
            <p className="text-xs text-text-secondary mt-2 mb-8">Transactions by risk level</p>
            <div className="flex items-center">
              <div className="relative flex-1">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={mappedRiskDist} dataKey="count" nameKey="level" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} stroke="none">
                      {mappedRiskDist.map(d => <Cell key={d.level} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#F5F7FA', fontWeight: 600, marginBottom: '4px' }} itemStyle={{ fontSize: '13px', color: '#F5F7FA' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-text-primary">{formatNumber(mappedRiskDist.reduce((s, d) => s + d.count, 0))}</span>
                  <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mt-1">TOTAL</span>
                </div>
              </div>
              <div className="w-1/3 flex flex-col justify-center space-y-4">
                {mappedRiskDist.map(r => (
                  <div key={r.level} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                      <span className="text-xs text-text-secondary uppercase tracking-wider">{r.level}</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary pl-4">{formatNumber(r.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
