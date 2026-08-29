import { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Activity, AlertTriangle, TrendingUp, Bell } from 'lucide-react';
import { AdminLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/common/States';
import { Badge } from '@/components/common/Badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAlerts, getAdminStats, getTransactions } from '@/services/fraudService';
import type { Alert, AdminStats, Transaction } from '@/types';
import { classNames } from '@/utils/helpers';

type ThreatLevel = 'NORMAL' | 'ELEVATED' | 'CRITICAL';

const threatConfig: Record<ThreatLevel, { color: string; bg: string; text: string; border: string }> = {
  NORMAL: { color: '#22c55e', bg: 'bg-success-500/10', text: 'text-success-500', border: 'border-success-500/30' },
  ELEVATED: { color: '#eab308', bg: 'bg-warning-500/10', text: 'text-warning-500', border: 'border-warning-500/30' },
  CRITICAL: { color: '#e11d48', bg: 'bg-critical-500/10', text: 'text-critical-400', border: 'border-critical-500/30' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function FraudMonitoring() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAlerts(), getAdminStats(), getTransactions()]).then(([a, s, t]) => {
      setAlerts(a);
      setStats(s);
      setTransactions(t);
      setLoading(false);
    });
  }, []);

  const riskTrendData = useMemo(() => {
    return MONTHS.map(month => {
      const monthTxns = transactions.filter(t => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return MONTHS[d.getMonth()] === month;
      });
      const fraud = monthTxns.filter(t => t.prediction === 'Fraud').length;
      const suspicious = monthTxns.filter(t => t.prediction === 'Suspicious').length;
      return { month, fraud, suspicious };
    });
  }, [transactions]);

  if (loading) return <AdminLayout><LoadingState message="Loading monitoring data..." /></AdminLayout>;

  const threatLevel: ThreatLevel = (stats?.activeAlerts || 0) > 20 ? 'CRITICAL' : (stats?.activeAlerts || 0) > 10 ? 'ELEVATED' : 'NORMAL';
  const tc = threatConfig[threatLevel];
  const activeFraudCases = alerts.filter(a => a.severity === 'Critical' || a.severity === 'High').length;
  const highRiskTxns = alerts.filter(a => a.riskScore >= 60).length;

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Threat Level Banner */}
        <div className={classNames('card p-6 border-2', tc.border, tc.bg)}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={classNames('w-14 h-14 rounded-xl flex items-center justify-center', tc.bg)}>
                <ShieldAlert className={classNames('w-7 h-7', tc.text)} />
              </div>
              <div>
                <p className="text-sm text-ink-400">System Threat Level</p>
                <p className={classNames('text-2xl font-bold', tc.text)}>{threatLevel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={classNames('w-3 h-3 rounded-full animate-pulse-soft', tc.text.replace('text-', 'bg-'))} />
              <span className="text-sm text-ink-300">Live monitoring active</span>
            </div>
          </div>
        </div>

        {/* Monitoring Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Fraud Cases', value: activeFraudCases, icon: AlertTriangle, accent: 'text-critical-400 bg-critical-500/10' },
            { label: 'High-Risk Transactions', value: highRiskTxns, icon: Activity, accent: 'text-danger-500 bg-danger-500/10' },
            { label: 'Active Alerts', value: stats?.activeAlerts ?? 0, icon: Bell, accent: 'text-warning-500 bg-warning-500/10' },
            { label: 'Fraud Rate', value: `${stats?.fraudRate ?? 0}%`, icon: TrendingUp, accent: 'text-accent-400 bg-accent-500/10' },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="card p-5">
                <div className={classNames('w-10 h-10 rounded-lg flex items-center justify-center mb-3', c.accent)}><Icon className="w-5 h-5" /></div>
                <p className="text-2xl font-bold text-ink-100">{c.value}</p>
                <p className="text-sm text-ink-400 mt-0.5">{c.label}</p>
              </div>
            );
          })}
        </div>

        {/* Risk Trend */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-100 mb-4">Risk Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={riskTrendData} margin={{ left: -20, right: 10, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6a6a76', fontSize: 12 }} axisLine={{ stroke: '#2a2a30' }} tickLine={false} />
              <YAxis tick={{ fill: '#6a6a76', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#141417', border: '1px solid #2a2a30', borderRadius: '8px' }} labelStyle={{ color: '#d4d4dc' }} />
              <Line type="monotone" dataKey="fraud" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} name="Fraud" />
              <Line type="monotone" dataKey="suspicious" stroke="#eab308" strokeWidth={2} dot={{ r: 3 }} name="Suspicious" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Alerts */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-100 mb-4">Recent Alerts</h3>
          <div className="space-y-2">
            {alerts.slice(0, 6).map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-ink-850 border border-ink-700/50">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${a.severity === 'Critical' ? 'bg-critical-500' : a.severity === 'High' ? 'bg-danger-500' : a.severity === 'Medium' ? 'bg-warning-500' : 'bg-accent-500'}`} />
                  <div>
                    <p className="text-sm text-ink-100">{a.title}</p>
                    <p className="text-xs text-ink-400">{a.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink-200">Risk: {a.riskScore}</span>
                  <Badge variant={a.severity === 'Critical' ? 'critical' : a.severity === 'High' ? 'danger' : a.severity === 'Medium' ? 'warning' : 'info'}>{a.severity}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
