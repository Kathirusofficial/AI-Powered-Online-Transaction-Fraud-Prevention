import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ShieldCheck, AlertTriangle, Percent, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import KPICard from '@/components/dashboard/KPICard';
import TransactionActivityChart from '@/components/dashboard/TransactionActivityChart';
import FraudDistributionChart from '@/components/dashboard/FraudDistributionChart';
import { LoadingState } from '@/components/common/States';
import { getDashboardStats, getTransactions } from '@/services/fraudService';
import type { DashboardStats, Transaction } from '@/types';
import { formatNumber, formatCurrency } from '@/utils/helpers';
import { classNames } from '@/utils/helpers';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getTransactions()]).then(([s, t]) => {
      setStats(s);
      setRecent(t.slice(0, 5)); // Just get 5 for the live feed
      setLoading(false);
    });
  }, []);

  if (loading) return <DashboardLayout><LoadingState message="Loading dashboard..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">FRAUD INTELLIGENCE CENTER</h1>
          <p className="text-text-secondary mt-1">Real-time transaction monitoring and AI-powered fraud detection.</p>
          <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-text-secondary uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success"></span> AI ENGINE ONLINE</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success"></span> DATABASE CONNECTED</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft"></span> MONITORING ACTIVE</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard label="TOTAL TRANSACTIONS" value={formatNumber(stats?.totalTransactions ?? 0)} icon={<ArrowLeftRight className="w-5 h-5" />} to="/transactions" />
          <KPICard label="GENUINE" value={formatNumber(stats?.genuine ?? 0)} icon={<ShieldCheck className="w-5 h-5" />} accent="success" to="/transactions?filter=genuine" />
          <KPICard label="SUSPICIOUS" value={formatNumber(stats?.suspicious ?? 0)} icon={<AlertTriangle className="w-5 h-5" />} accent="warning" to="/transactions?filter=suspicious" />
          <KPICard label="FRAUD DETECTED" value={formatNumber(stats?.fraud ?? 0)} icon={<AlertTriangle className="w-5 h-5" />} accent="danger" to="/fraud-alerts" />
          <KPICard label="FRAUD RATE" value={`${stats?.fraudRate ?? 0}%`} icon={<Percent className="w-5 h-5" />} accent="danger" to="/fraud-alerts" />
        </div>

        {/* Main Dashboard Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-6">TRANSACTION ACTIVITY</h3>
            <TransactionActivityChart />
          </div>
          <div className="card p-6 animate-fade-in-up flex flex-col">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-6">FRAUD DISTRIBUTION</h3>
            <div className="flex-1 flex flex-col justify-center">
              <FraudDistributionChart />
            </div>
          </div>
        </div>

        {/* Live Threat Feed */}
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="p-5 border-b border-border flex items-center justify-between bg-background/50">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">LIVE THREAT ACTIVITY</h3>
            <Link to="/transactions" className="text-xs font-medium text-primary hover:text-opacity-80 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {recent.length === 0 ? (
               <div className="p-8 text-center text-sm text-text-secondary uppercase tracking-wider">NO RECENT THREATS</div>
            ) : (
              recent.map((txn) => {
                const isCritical = txn.riskScore >= 90;
                const isHigh = txn.riskScore >= 75 && txn.riskScore < 90;
                const isMedium = txn.riskScore >= 50 && txn.riskScore < 75;

                const riskText = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : isMedium ? 'MEDIUM' : 'LOW';
                const riskColor = isCritical ? 'text-danger' : isHigh ? 'text-warning' : isMedium ? 'text-warning/70' : 'text-success';

                return (
                  <Link key={txn.id} to={`/transactions/${txn.id}`} className="flex items-center justify-between p-4 hover:bg-background/60 transition-colors group">
                    <div className="flex items-center gap-8 w-1/3">
                       <span className={classNames('text-xs font-bold w-20', riskColor)}>{riskText}</span>
                       <span className="text-sm font-mono text-text-primary group-hover:text-primary transition-colors">{txn.id}</span>
                    </div>
                    <div className="w-1/4 text-sm text-text-primary">{formatCurrency(txn.amount)}</div>
                    <div className="w-1/4 text-sm font-medium text-text-primary">Score: {txn.riskScore}</div>
                    <div className="w-1/6 text-right text-xs text-text-secondary flex items-center justify-end gap-1 group-hover:text-primary transition-colors">
                      <span>View</span> <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
