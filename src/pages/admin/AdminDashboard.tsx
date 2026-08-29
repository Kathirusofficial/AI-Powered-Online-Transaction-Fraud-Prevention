import { useState, useEffect, useMemo } from 'react';
import { Users, ArrowLeftRight, AlertTriangle, AlertCircle, Percent, Bell } from 'lucide-react';
import { AdminLayout } from '@/components/layout/DashboardLayout';
import KPICard from '@/components/dashboard/KPICard';
import { LoadingState } from '@/components/common/States';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getAdminStats, getTransactions } from '@/services/fraudService';
import { mockUsers } from '@/data/mockData';
import type { AdminStats, Transaction } from '@/types';
import { formatNumber } from '@/utils/helpers';

const tooltipStyle = { background: '#141417', border: '1px solid #2a2a30', borderRadius: '8px' };
const axisProps = { tick: { fill: '#6a6a76', fontSize: 12 }, axisLine: { stroke: '#2a2a30' }, tickLine: false as const };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TYPES = ['Payment', 'Transfer', 'Withdrawal', 'Deposit', 'Purchase'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getTransactions()]).then(([s, t]) => {
      setStats(s);
      setTransactions(t);
      setLoading(false);
    });
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

  const riskDistData = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    transactions.forEach(t => {
      if (t.riskLevel in counts) counts[t.riskLevel]++;
    });
    return [
      { level: 'Low', count: counts.Low, color: '#22c55e' },
      { level: 'Medium', count: counts.Medium, color: '#eab308' },
      { level: 'High', count: counts.High, color: '#ef4444' },
      { level: 'Critical', count: counts.Critical, color: '#e11d48' },
    ];
  }, [transactions]);

  const fraudByTypeData = useMemo(() => {
    return TYPES.map(type => {
      const typeTxns = transactions.filter(t => t.type === type);
      const fraud = typeTxns.filter(t => t.prediction === 'Fraud').length;
      const genuine = typeTxns.filter(t => t.prediction === 'Genuine').length;
      return { type, fraud, genuine };
    });
  }, [transactions]);

  if (loading) return <AdminLayout><LoadingState message="Loading admin dashboard..." /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard label="Total Users" value={formatNumber(stats?.totalUsers ?? mockUsers.length)} icon={<Users className="w-5 h-5" />} accent="accent" />
          <KPICard label="Total Transactions" value={formatNumber(stats?.totalTransactions ?? 0)} icon={<ArrowLeftRight className="w-5 h-5" />} accent="accent" />
          <KPICard label="Fraud Cases" value={formatNumber(stats?.fraudCases ?? 0)} icon={<AlertTriangle className="w-5 h-5" />} accent="critical" />
          <KPICard label="Suspicious Cases" value={formatNumber(stats?.suspiciousCases ?? 0)} icon={<AlertCircle className="w-5 h-5" />} accent="warning" />
          <KPICard label="Fraud Rate" value={`${stats?.fraudRate ?? 0}%`} icon={<Percent className="w-5 h-5" />} accent="danger" />
          <KPICard label="Active Alerts" value={formatNumber(stats?.activeAlerts ?? 0)} icon={<Bell className="w-5 h-5" />} accent="warning" />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-ink-100 mb-4">Fraud Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyStats} margin={{ left: -20, right: 10, top: 5 }}>
                <defs><linearGradient id="adminFraudGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e11d48" stopOpacity={0.3} /><stop offset="100%" stopColor="#e11d48" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#d4d4dc' }} />
                <Area type="monotone" dataKey="fraud" stroke="#e11d48" strokeWidth={2} fill="url(#adminFraudGrad)" name="Fraud" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-semibold text-ink-100 mb-4">Transaction Volume</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyStats} margin={{ left: -20, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#d4d4dc' }} cursor={{ fill: '#1a1a1e' }} />
                <Bar dataKey="volume" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Volume" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-ink-100 mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={riskDistData} dataKey="count" nameKey="level" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} stroke="none">
                  {riskDistData.map(d => <Cell key={d.level} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#d4d4dc' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-semibold text-ink-100 mb-4">Fraud by Type</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={fraudByTypeData} margin={{ left: -20, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
                <XAxis dataKey="type" {...axisProps} />
                <YAxis {...axisProps} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#d4d4dc' }} cursor={{ fill: '#1a1a1e' }} />
                <Bar dataKey="fraud" fill="#e11d48" radius={[4, 4, 0, 0]} name="Fraud" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
