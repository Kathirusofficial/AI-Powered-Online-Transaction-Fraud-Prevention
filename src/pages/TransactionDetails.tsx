import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Smartphone, DollarSign, Activity, AlertCircle, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PredictionBadge, RiskBadge } from '@/components/common/Badge';
import RiskGauge from '@/components/common/RiskGauge';
import { LoadingState, ErrorState } from '@/components/common/States';
import { getTransactionById } from '@/services/fraudService';
import type { Transaction } from '@/types';
import { formatCurrency, riskColors } from '@/utils/helpers';

export default function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getTransactionById(id || '').then(t => {
      if (t) setTxn(t);
      else setError(true);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <DashboardLayout><LoadingState message="Loading transaction details..." /></DashboardLayout>;
  if (error || !txn) return <DashboardLayout><ErrorState message="Transaction not found" onRetry={() => navigate('/transactions')} /></DashboardLayout>;

  const c = riskColors[txn.riskLevel];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-xl font-semibold text-ink-100">{txn.id}</h2>
            <p className="text-sm text-ink-400">Transaction security analysis</p>
          </div>
        </div>

        {/* Overview + Risk */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-6">
            <h3 className="text-sm font-semibold text-ink-100 mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-accent-500 rounded-full" /> Transaction Overview</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Transaction ID', value: txn.id, icon: DollarSign },
                { label: 'Amount', value: formatCurrency(txn.amount), icon: DollarSign },
                { label: 'Type', value: txn.type, icon: Activity },
                { label: 'Merchant', value: txn.merchantCategory, icon: Activity },
                { label: 'Date', value: txn.date, icon: Calendar },
                { label: 'Time', value: txn.time, icon: Clock },
                { label: 'Location', value: txn.location, icon: MapPin },
                ...(txn.latitude && txn.longitude ? [
                  { label: 'GPS Coordinates', value: `${txn.latitude}, ${txn.longitude}`, icon: MapPin }
                ] : []),
                { label: 'Device', value: txn.deviceType, icon: Smartphone },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center text-ink-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-400">{f.label}</p>
                      <p className="text-sm text-ink-100 font-medium">{f.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6 flex flex-col items-center justify-center">
            <RiskGauge score={txn.riskScore} level={txn.riskLevel} size={160} />
            <div className="flex items-center gap-2 mt-4">
              <PredictionBadge prediction={txn.prediction} />
              <RiskBadge level={txn.riskLevel} />
            </div>
            <div className="grid grid-cols-2 gap-3 w-full mt-5">
              <div className="bg-ink-850 rounded-lg p-3 text-center">
                <p className="text-xs text-ink-400">Fraud Probability</p>
                <p className={`text-lg font-bold ${c.text}`}>{txn.fraudProbability}%</p>
              </div>
              <div className="bg-ink-850 rounded-lg p-3 text-center">
                <p className="text-xs text-ink-400">Status</p>
                <p className="text-sm font-medium text-ink-200 mt-1">{txn.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Behavioral Analysis */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-100 mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-accent-500 rounded-full" /> Behavioral Analysis</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Transaction Frequency', value: `${txn.transactionFrequency}/day` },
              { label: 'Previous Amount', value: formatCurrency(txn.previousTransactionAmount) },
              { label: 'Account Age', value: `${txn.accountAge} days` },
              { label: 'Location Distance', value: `${(txn.distanceFromPreviousKm !== undefined ? txn.distanceFromPreviousKm : txn.distanceFromPrevious).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km` },
              { label: 'IP Risk Score', value: `${txn.ipRiskScore}/100` },
            ].map(f => (
              <div key={f.label} className="bg-ink-850 rounded-lg p-4">
                <p className="text-xs text-ink-400">{f.label}</p>
                <p className="text-base font-semibold text-ink-100 mt-1">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Factors + Timeline */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-ink-100 mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-critical-500 rounded-full" /> Risk Factors</h3>
            <div className="space-y-2.5">
              {txn.riskFactors.map((f, i) => {
                const isRisk = /high|large|elevated|deviation|unusual|incident|variance|higher/i.test(f) || (txn.riskScore >= 60);
                const isModerate = /noticeable|moderate|verification|off-peak/i.test(f);
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-ink-850 border border-ink-700/50">
                    {isRisk ? (
                      <AlertCircle className="w-5 h-5 text-critical-500 shrink-0 mt-0.5" />
                    ) : isModerate ? (
                      <AlertCircle className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-success-500 shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm text-ink-200 leading-relaxed">{f}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-ink-100 mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-accent-500 rounded-full" /> Timeline</h3>
            <div className="space-y-4">
              {txn.timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${event.status === 'danger' ? 'bg-critical-500' : event.status === 'warning' ? 'bg-warning-500' : 'bg-accent-500'}`} />
                    {i < txn.timeline.length - 1 && <span className="w-px flex-1 bg-ink-700 my-1" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm text-ink-100">{event.event}</p>
                    <p className="text-xs text-ink-400">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link to="/transactions" className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back to Transactions</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
