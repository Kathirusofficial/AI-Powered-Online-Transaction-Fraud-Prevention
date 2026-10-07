import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Square, 
  Activity, 
  Cpu, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  AlertCircle,
  Eye
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PredictionBadge, RiskBadge } from '@/components/common/Badge';
import { useToast } from '@/hooks/useToast';
import { 
  getMLServiceHealth, 
  ingestTransaction, 
  getTransactions, 
  type MLHealthStatus 
} from '@/services/fraudService';
import type { Transaction } from '@/types';
import { formatCurrency, classNames } from '@/utils/helpers';

const DEMO_TRANSACTION_PROFILES = [
  { amount: 18.50, type: 'Payment', merchantCategory: 'Groceries', location: 'Los Angeles, US', accountAge: 365, previousTransactionAmount: 22.0, transactionFrequency: 3, previousFraudCount: 0, distanceFromPrevious: 2.0, deviceType: 'Mobile', ipRiskScore: 12 },
  { amount: 4500.00, type: 'Transfer', merchantCategory: 'Travel', location: 'Overseas Terminal', accountAge: 45, previousTransactionAmount: 50.0, transactionFrequency: 15, previousFraudCount: 1, distanceFromPrevious: 1500.0, deviceType: 'Unknown', ipRiskScore: 90 },
  { amount: 42.80, type: 'Payment', merchantCategory: 'Food & Dining', location: 'San Francisco, US', accountAge: 720, previousTransactionAmount: 35.0, transactionFrequency: 2, previousFraudCount: 0, distanceFromPrevious: 4.5, deviceType: 'Mobile', ipRiskScore: 15 },
  { amount: 1250.00, type: 'Purchase', merchantCategory: 'Online', location: 'Miami, US', accountAge: 90, previousTransactionAmount: 80.0, transactionFrequency: 8, previousFraudCount: 0, distanceFromPrevious: 650.0, deviceType: 'Desktop', ipRiskScore: 75 },
  { amount: 8.50, type: 'Payment', merchantCategory: 'Gas', location: 'Chicago, US', accountAge: 500, previousTransactionAmount: 15.0, transactionFrequency: 1, previousFraudCount: 0, distanceFromPrevious: 1.2, deviceType: 'Mobile', ipRiskScore: 8 },
  { amount: 3200.00, type: 'Purchase', merchantCategory: 'Electronics', location: 'New York, US', accountAge: 60, previousTransactionAmount: 120.0, transactionFrequency: 11, previousFraudCount: 0, distanceFromPrevious: 820.0, deviceType: 'Tablet', ipRiskScore: 80 },
];

export default function Monitor() {
  const { toast } = useToast();
  const [streamState, setStreamState] = useState<'stopped' | 'running' | 'paused'>('stopped');
  const [health, setHealth] = useState<MLHealthStatus>({
    status: 'offline',
    model_loaded: false,
    model_version: '...',
    feature_count: 0,
    algorithm: '...',
  });
  const [liveTxns, setLiveTxns] = useState<Transaction[]>([]);
  const [streamIndex, setStreamIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamIntervalMs, setStreamIntervalMs] = useState(6000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check ML API Health periodically
  const checkHealth = useCallback(async () => {
    const h = await getMLServiceHealth();
    setHealth(h);
    return h;
  }, []);

  useEffect(() => {
    checkHealth();
    getTransactions().then(txns => {
      setLiveTxns(txns.slice(0, 15));
    });
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Process the next transaction in the stream
  const processNextTransaction = useCallback(async () => {
    if (isProcessing) return;

    const currentHealth = await checkHealth();
    if (currentHealth.status !== 'ok') {
      setStreamState('stopped');
      toast('ML Service Unavailable. Please start the FraudShield ML service and try again.', 'error');
      return;
    }

    setIsProcessing(true);
    const profile = DEMO_TRANSACTION_PROFILES[streamIndex % DEMO_TRANSACTION_PROFILES.length];
    setStreamIndex(prev => prev + 1);

    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const { transaction, result } = await ingestTransaction({
        ...profile,
        location: `${profile.location} (Demo Ingestion)`,
        date: now.toISOString().split('T')[0],
        time: timeStr.slice(0, 5),
      });

      setLiveTxns(prev => [transaction, ...prev.slice(0, 24)]);

      if (result.prediction === 'Fraud' || result.riskLevel === 'Critical') {
        toast(`⚠️ Fraud Alert Generated: $${profile.amount.toFixed(2)} (${profile.merchantCategory}) - Score ${result.riskScore}/100`, 'error');
      }
    } catch (err: unknown) {
      console.error('Ingestion error:', err);
      const msg = (err as Error)?.message || 'Ingestion failed: ML Service Unavailable';
      toast(msg, 'error');
      setStreamState('stopped');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, streamIndex, checkHealth, toast]);

  // Handle stream timer
  useEffect(() => {
    if (streamState === 'running') {
      timerRef.current = setInterval(processNextTransaction, streamIntervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [streamState, streamIntervalMs, processNextTransaction]);

  const handleStart = async () => {
    const h = await checkHealth();
    if (h.status !== 'ok') {
      toast('ML Service Unavailable. Please start the FraudShield ML service and try again.', 'error');
      return;
    }
    setStreamState('running');
    toast('Transaction monitoring stream started', 'success');
    processNextTransaction();
  };

  const handlePause = () => {
    setStreamState('paused');
    toast('Transaction monitoring stream paused', 'info');
  };

  const handleStop = () => {
    setStreamState('stopped');
    toast('Transaction monitoring stream stopped', 'info');
  };

  // Stats calculation
  const fraudCount = liveTxns.filter(t => t.prediction === 'Fraud').length;
  const genuineCount = liveTxns.filter(t => t.prediction === 'Genuine').length;
  const criticalAlerts = liveTxns.filter(t => t.riskLevel === 'Critical').length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary animate-pulse" />
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">REAL-TIME TRANSACTION MONITOR</h1>
            </div>
            <p className="text-text-secondary mt-1 text-sm">
              Incoming transactions are automatically evaluated in real-time by the trained XGBoost model.
            </p>
          </div>

          <Link to="/detect" className="btn-secondary text-xs inline-flex items-center gap-1.5 self-start sm:self-auto">
            Switch to Manual Tester <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* DEMO NOTICE BANNER */}
        <div className="p-4 rounded-lg bg-surface border border-border flex items-start gap-3 text-xs text-text-secondary">
          <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary">Demonstration Ingestion Stream: </span>
            In this demonstration mode, continuous transaction payloads are streamed through the ingestion endpoint to showcase real-time XGBoost inference. In production, this service receives transaction feeds directly from payment gateways, POS terminals, and core banking APIs.
          </div>
        </div>

        {/* ML HEALTH & STREAM CONTROLS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* ML Service Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">ML SERVICE</span>
              <span className={classNames('w-2 h-2 rounded-full', health.status === 'ok' ? 'bg-success animate-pulse' : 'bg-danger')} />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className={classNames('text-lg font-bold uppercase', health.status === 'ok' ? 'text-success' : 'text-danger')}>
                {health.status === 'ok' ? 'ONLINE' : 'OFFLINE'}
              </span>
              <span className="text-xs text-text-muted font-mono">{health.model_version}</span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {health.algorithm} • {health.feature_count} features
            </p>
          </div>

          {/* Stream Status Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">STREAM STATUS</span>
              <span className={classNames('w-2 h-2 rounded-full', 
                streamState === 'running' ? 'bg-primary animate-pulse' : 
                streamState === 'paused' ? 'bg-warning' : 'bg-text-muted')} 
              />
            </div>
            <div className="mt-3">
              <span className={classNames('text-lg font-bold uppercase',
                streamState === 'running' ? 'text-primary' : 
                streamState === 'paused' ? 'text-warning' : 'text-text-secondary')}
              >
                {streamState === 'running' ? 'STREAMING ACTIVE' : streamState === 'paused' ? 'STREAM PAUSED' : 'STREAM IDLE'}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Interval: {streamIntervalMs / 1000}s per transaction
            </p>
          </div>

          {/* KPI 1: Genuine Count */}
          <div className="card p-5">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">GENUINE EVALUATED</span>
            <div className="mt-3 text-2xl font-bold text-success flex items-center justify-between">
              <span>{genuineCount}</span>
              <ShieldCheck className="w-5 h-5 text-success/70" />
            </div>
            <p className="text-xs text-text-secondary mt-1">Classified as normal behavior</p>
          </div>

          {/* KPI 2: Fraud & Critical Alerts */}
          <div className="card p-5">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">FRAUD DETECTED</span>
            <div className="mt-3 text-2xl font-bold text-danger flex items-center justify-between">
              <span>{fraudCount}</span>
              <ShieldAlert className="w-5 h-5 text-danger/70" />
            </div>
            <p className="text-xs text-text-secondary mt-1">{criticalAlerts} Critical alerts created</p>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {streamState !== 'running' ? (
              <button
                onClick={handleStart}
                disabled={health.status !== 'ok'}
                className="bg-primary hover:bg-opacity-90 text-background font-bold px-5 py-2.5 rounded-lg text-xs tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" /> START MONITORING
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="bg-warning text-background font-bold px-5 py-2.5 rounded-lg text-xs tracking-wider flex items-center gap-2 transition-all"
              >
                <Pause className="w-4 h-4 fill-current" /> PAUSE
              </button>
            )}

            <button
              onClick={handleStop}
              disabled={streamState === 'stopped'}
              className="bg-surface hover:bg-border text-danger border border-danger/30 font-bold px-4 py-2.5 rounded-lg text-xs tracking-wider flex items-center gap-2 transition-all disabled:opacity-40"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> STOP
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-text-secondary w-full sm:w-auto justify-end">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Ingestion Speed:
            </span>
            <select
              value={streamIntervalMs}
              onChange={e => setStreamIntervalMs(Number(e.target.value))}
              disabled={streamState === 'running'}
              className="bg-background border border-border rounded px-2.5 py-1 text-xs text-text-primary"
            >
              <option value={4000}>Fast (4s)</option>
              <option value={6000}>Normal (6s)</option>
              <option value={10000}>Slow (10s)</option>
            </select>
          </div>
        </div>

        {/* OFFLINE WARNING IF ML SERVICE DOWN */}
        {health.status !== 'ok' && (
          <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">ML Service Unavailable. </span>
              Please start the FraudShield FastAPI service (`python -m uvicorn ml.predict:app --port 8000`) to enable live inference.
            </div>
          </div>
        )}

        {/* LIVE INGESTION TABLE */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between bg-surface/50">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-text-secondary tracking-wider">LIVE INGESTION & INFERENCE FEED</h2>
            </div>
            <span className="text-xs text-text-muted font-mono">{liveTxns.length} transactions recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-secondary uppercase tracking-wider border-b border-border bg-background/50">
                  <th className="px-4 py-3.5 font-semibold">Transaction ID</th>
                  <th className="px-4 py-3.5 font-semibold">Time</th>
                  <th className="px-4 py-3.5 font-semibold">Amount</th>
                  <th className="px-4 py-3.5 font-semibold">Category</th>
                  <th className="px-4 py-3.5 font-semibold">Location</th>
                  <th className="px-4 py-3.5 font-semibold">ML Probability</th>
                  <th className="px-4 py-3.5 font-semibold">Risk Score</th>
                  <th className="px-4 py-3.5 font-semibold">Prediction</th>
                  <th className="px-4 py-3.5 font-semibold">Risk Level</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {liveTxns.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-text-secondary">
                      <div className="flex flex-col items-center justify-center">
                        <Activity className="w-8 h-8 text-border mb-2" />
                        <p className="text-sm">No live transactions yet</p>
                        <p className="text-xs text-text-muted mt-1">Click "START MONITORING" to begin streaming transactions through the XGBoost model.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  liveTxns.map((txn) => (
                    <tr key={txn.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-text-primary text-xs font-semibold">{txn.id}</td>
                      <td className="px-4 py-3.5 text-xs text-text-secondary whitespace-nowrap">{txn.time}</td>
                      <td className="px-4 py-3.5 font-semibold text-text-primary">{formatCurrency(txn.amount)}</td>
                      <td className="px-4 py-3.5 text-text-secondary text-xs">{txn.merchantCategory}</td>
                      <td className="px-4 py-3.5 text-text-secondary text-xs">{txn.location}</td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-text-primary">{txn.fraudProbability}%</td>
                      <td className="px-4 py-3.5">
                        <span className={`font-mono text-xs font-bold ${txn.riskScore >= 75 ? 'text-danger' : txn.riskScore >= 50 ? 'text-warning' : 'text-success'}`}>
                          {txn.riskScore}/100
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <PredictionBadge prediction={txn.prediction} />
                      </td>
                      <td className="px-4 py-3.5">
                        <RiskBadge level={txn.riskLevel} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link to={`/transactions/${txn.id}`} className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
