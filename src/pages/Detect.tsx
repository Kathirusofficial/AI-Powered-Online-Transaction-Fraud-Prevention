import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanSearch, Loader2, AlertCircle, ArrowRight, RotateCcw, Cpu, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import RiskGauge from '@/components/common/RiskGauge';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { analyzeTransaction, type AnalyzeInput } from '@/services/fraudService';
import type { AnalyzeResult } from '@/types';
import { riskColors } from '@/utils/helpers';

const typeOptions = ['Payment', 'Transfer', 'Withdrawal', 'Deposit', 'Purchase'].map(v => ({ value: v, label: v }));
const merchantOptions = ['Retail', 'Food & Dining', 'Travel', 'Entertainment', 'Electronics', 'Groceries', 'Healthcare', 'Gas', 'Online', 'Other'].map(v => ({ value: v, label: v }));
const deviceOptions = ['Mobile', 'Desktop', 'Tablet', 'Unknown'].map(v => ({ value: v, label: v }));

const today = new Date().toISOString().split('T')[0];

export default function Detect() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [form, setForm] = useState<AnalyzeInput>({
    amount: 0, type: 'Payment', merchantCategory: 'Retail', location: '', date: today, time: '12:00',
    accountAge: 365, previousTransactionAmount: 500, transactionFrequency: 5, previousFraudCount: 0,
    distanceFromPrevious: 0, deviceType: 'Mobile', ipRiskScore: 20,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof AnalyzeInput, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.amount || form.amount <= 0) e.amount = 'Amount required';
    if (!form.location) e.location = 'Location required';
    if (!form.date) e.date = 'Date required';
    if (!form.time) e.time = 'Time required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (loading) return;
    if (!validate()) { toast('Please fix the form errors', 'error'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeTransaction({
        ...form,
        userId: user?.email ? `U_${user.email}` : 'U0001',
        userName: user?.name || 'Current User',
      });
      setResult(res);
      toast('Analysis complete', 'success');
    } catch (err: any) {
      toast(err?.message || 'ML Service Unavailable. Please start the FraudShield ML service and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setForm({ amount: 0, type: 'Payment', merchantCategory: 'Retail', location: '', date: today, time: '12:00', accountAge: 365, previousTransactionAmount: 500, transactionFrequency: 5, previousFraudCount: 0, distanceFromPrevious: 0, deviceType: 'Mobile', ipRiskScore: 20 });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">MANUAL TRANSACTION ANALYSIS</h1>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Demo / Test Mode
              </span>
            </div>
            <p className="text-text-secondary mt-1 text-sm">
              Interactive single-transaction testing powered by the real XGBoost ML model.
            </p>
          </div>

          <button 
            onClick={() => navigate('/monitor')}
            className="btn-secondary text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            Switch to Live Monitor <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: Input */}
          <div className="card p-6 lg:p-8 animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-10">
              
              {/* TRANSACTION DETAILS */}
              <section>
                <h2 className="text-sm font-semibold text-text-primary tracking-wider mb-6 border-b border-border pb-2">TRANSACTION DETAILS</h2>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  <Input label="Transaction ID" placeholder="Auto-generated" hint="Leave blank for auto-generation" />
                  <Input label="Amount" type="number" name="amount" placeholder="0.00" value={form.amount || ''} onChange={e => set('amount', parseFloat(e.target.value) || 0)} error={errors.amount} />
                  <Select label="Transaction Type" name="type" options={typeOptions} value={form.type} onChange={e => set('type', e.target.value)} />
                  <Select label="Merchant Category" name="merchantCategory" options={merchantOptions} value={form.merchantCategory} onChange={e => set('merchantCategory', e.target.value)} />
                  <Input label="Merchant URL (Optional)" type="url" name="merchantUrl" placeholder="https://..." value={form.merchantUrl || ''} onChange={e => set('merchantUrl', e.target.value)} />
                  <Input label="Location" name="location" placeholder="New York, US" value={form.location} onChange={e => set('location', e.target.value)} error={errors.location} />
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                    <Input label="Date" type="date" name="date" value={form.date} onChange={e => set('date', e.target.value)} error={errors.date} />
                    <Input label="Time" type="time" name="time" value={form.time} onChange={e => set('time', e.target.value)} error={errors.time} />
                  </div>
                </div>
              </section>

              {/* USER BEHAVIOR */}
              <section>
                <h2 className="text-sm font-semibold text-text-primary tracking-wider mb-6 border-b border-border pb-2">USER BEHAVIOR</h2>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  <Input label="Account Age (days)" type="number" value={form.accountAge} onChange={e => set('accountAge', parseInt(e.target.value) || 0)} />
                  <Input label="Previous Txn Amount" type="number" value={form.previousTransactionAmount} onChange={e => set('previousTransactionAmount', parseFloat(e.target.value) || 0)} />
                  <Input label="Txn Frequency (per day)" type="number" value={form.transactionFrequency} onChange={e => set('transactionFrequency', parseInt(e.target.value) || 0)} />
                  <Input label="Previous Fraud Count" type="number" value={form.previousFraudCount} onChange={e => set('previousFraudCount', parseInt(e.target.value) || 0)} />
                  <Input label="Distance From Prev (km)" type="number" value={form.distanceFromPrevious} onChange={e => set('distanceFromPrevious', parseInt(e.target.value) || 0)} />
                </div>
              </section>

              {/* DEVICE & NETWORK */}
              <section>
                <h2 className="text-sm font-semibold text-text-primary tracking-wider mb-6 border-b border-border pb-2">DEVICE & NETWORK</h2>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  <Select label="Device Type" options={deviceOptions} value={form.deviceType} onChange={e => set('deviceType', e.target.value)} />
                  <Input label="IP Risk Score (0-100)" type="number" min="0" max="100" value={form.ipRiskScore} onChange={e => set('ipRiskScore', parseInt(e.target.value) || 0)} />
                </div>
              </section>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-opacity-90 text-background font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    ANALYZING WITH XGBOOST MODEL...
                  </>
                ) : (
                  <>
                    ANALYZE TRANSACTION <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="animate-fade-in">
            {!loading && !result && (
              <div className="card h-full flex flex-col items-center justify-center p-12 text-center bg-surface/50 border-dashed">
                <ScanSearch className="w-16 h-16 text-border mb-4" />
                <h3 className="text-lg font-medium text-text-secondary">Ready for Analysis</h3>
                <p className="text-sm text-text-secondary/70 mt-2 max-w-sm">Fill out the transaction details on the left and click Analyze to view the real XGBoost ML assessment.</p>
              </div>
            )}
            
            {loading && (
              <div className="card h-full flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                <h3 className="text-xl font-medium text-text-primary mb-2 tracking-tight">AI Analysis in Progress</h3>
                <p className="text-sm text-text-secondary">Evaluating 20 real features across trained XGBoost decision trees...</p>
              </div>
            )}

            {result && (
              <div className="card h-full flex flex-col">
                <div className="p-6 border-b border-border flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Cpu className="w-4 h-4 text-primary" />
                     <h2 className="text-sm font-semibold text-text-secondary tracking-wider">XGBOOST ML EVALUATION</h2>
                   </div>
                   {result.modelVersion && (
                     <span className="text-xs font-mono text-text-secondary bg-surface px-2 py-0.5 rounded border border-border">
                       ML {result.modelVersion}
                     </span>
                   )}
                </div>
                
                <div className="p-8 flex flex-col items-center flex-1">
                  
                  <div className="mb-10">
                    <RiskGauge score={result.riskScore} level={result.riskLevel} size={220} />
                  </div>

                  <div className="w-full grid gap-3">
                    <div className="flex items-center justify-between p-3.5 bg-background rounded-lg border border-border">
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">FRAUD PROBABILITY</span>
                      <span className="text-lg font-bold text-text-primary">{result.fraudProbability}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3.5 bg-background rounded-lg border border-border">
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">RISK SCORE</span>
                      <span className="text-lg font-bold text-text-primary">{result.riskScore} / 100</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-background rounded-lg border border-border">
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">MODEL PREDICTION</span>
                      <span className={`text-lg font-bold ${riskColors[result.riskLevel].text}`}>{result.prediction.toUpperCase()} ({result.riskLevel})</span>
                    </div>
                  </div>
                  
                  {/* WHY WAS THIS TRANSACTION EVALUATED WITH THIS RESULT? */}
                  <div className="w-full mt-6">
                     <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 border-b border-border pb-2">
                       WHY WAS THIS TRANSACTION EVALUATED WITH THIS RESULT?
                     </h3>
                     
                     {result.explanation?.summary && (
                       <p className="text-xs text-text-secondary mb-3 bg-surface/50 p-2.5 rounded border border-border/50">
                         {result.explanation.summary}
                       </p>
                     )}

                     <div className="space-y-2">
                       {(result.explanation?.evaluatedFactors || result.riskFactors).map((f, i) => (
                         <div key={i} className="flex items-start gap-2.5 text-xs text-text-primary bg-background/60 p-2 rounded border border-border/40">
                           {result.riskScore >= 40 ? (
                             <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                           ) : (
                             <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                           )}
                           <span>{f}</span>
                         </div>
                       ))}
                     </div>
                  </div>

                  {/* MODEL FEATURE IMPORTANCE BREAKDOWN */}
                  {result.explanation?.topModelFeatures && result.explanation.topModelFeatures.length > 0 && (
                    <div className="w-full mt-6">
                      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 border-b border-border pb-2">
                        MODEL FEATURE IMPORTANCE (LEARNED SIGNALS)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {result.explanation.topModelFeatures.slice(0, 4).map((feat, idx) => (
                          <div key={idx} className="p-2.5 bg-background rounded border border-border text-xs flex justify-between items-center">
                            <span className="text-text-secondary truncate mr-2">{feat.label}</span>
                            <span className="font-mono text-primary font-semibold">{(feat.importance * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TELEMETRY FOOTER */}
                  <div className="w-full mt-6 pt-4 border-t border-border flex justify-between items-center text-xs text-text-muted">
                    <span>Evaluated: 20 features • Algorithm: XGBoost</span>
                    <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1.5 text-text-secondary hover:text-text-primary">
                       <RotateCcw className="w-3.5 h-3.5" /> Reset Form
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
