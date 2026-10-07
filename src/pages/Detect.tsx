import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ScanSearch, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  Cpu, 
  CheckCircle2, 
  MapPin, 
  Crosshair, 
  Globe,
  ExternalLink
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import RiskGauge from '@/components/common/RiskGauge';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { analyzeTransaction, getLastLocation, type AnalyzeInput } from '@/services/fraudService';
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

  // Form State
  const [form, setForm] = useState<AnalyzeInput>({
    amount: 0,
    type: 'Payment',
    merchantCategory: 'Retail',
    location: '',
    latitude: null,
    longitude: null,
    accuracy: null,
    date: today,
    time: '12:00',
    accountAge: 365,
    previousTransactionAmount: 500,
    transactionFrequency: 5,
    previousFraudCount: 0,
    distanceFromPrevious: 0,
    deviceType: 'Mobile',
    ipRiskScore: 20,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Geolocation state
  const [geoStatus, setGeoStatus] = useState<'idle' | 'detecting' | 'detected' | 'error'>('idle');
  const [geoAccuracy, setGeoAccuracy] = useState<number | null>(null);
  const [geoErrorMsg, setGeoErrorMsg] = useState<string | null>(null);

  // Previous transaction location state from MongoDB
  const [prevLocation, setPrevLocation] = useState<{
    hasPrevious: boolean;
    latitude: number | null;
    longitude: number | null;
    displayName: string | null;
    accuracy: number | null;
    date?: string;
    time?: string;
    transactionId?: string;
  }>({
    hasPrevious: false,
    latitude: null,
    longitude: null,
    displayName: null,
    accuracy: null,
  });

  // Fetch authenticated user's last transaction location on mount
  useEffect(() => {
    getLastLocation().then(res => {
      if (res.hasPrevious && res.location) {
        setPrevLocation({
          hasPrevious: true,
          latitude: res.location.latitude,
          longitude: res.location.longitude,
          displayName: res.location.displayName || `Lat: ${res.location.latitude.toFixed(4)}, Lon: ${res.location.longitude.toFixed(4)}`,
          accuracy: res.location.accuracy || null,
          date: res.location.date,
          time: res.location.time,
          transactionId: res.location.transactionId,
        });
      }
    });
  }, []);

  const set = (k: keyof AnalyzeInput, v: string | number | null) => setForm(f => ({ ...f, [k]: v }));

  // Request browser geolocation
  const handleGetCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      const msg = 'Geolocation is not supported by your browser.';
      setGeoStatus('error');
      setGeoErrorMsg(msg);
      toast(msg, 'error');
      return;
    }

    setGeoStatus('detecting');
    setGeoErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lon = Number(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy);

        let locationName = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;

        // Optional reverse geocoding attempt with timeout fallback
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12`,
            { signal: AbortSignal.timeout(3000) }
          );
          if (res.ok) {
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state;
            const country = data.address?.country;
            if (city && country) {
              locationName = `${city}, ${country}`;
            } else if (data.display_name) {
              locationName = data.display_name.split(',').slice(0, 3).join(',');
            }
          }
        } catch (err) {
          console.warn('Reverse geocoding unavailable:', err);
        }

        // Preview distance if user has a previous transaction
        let estimatedDistance = 0;
        if (prevLocation.hasPrevious && prevLocation.latitude !== null && prevLocation.longitude !== null) {
          const R = 6371.0;
          const dLat = (lat - prevLocation.latitude) * (Math.PI / 180);
          const dLon = (lon - prevLocation.longitude) * (Math.PI / 180);
          const rLat1 = prevLocation.latitude * (Math.PI / 180);
          const rLat2 = lat * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          estimatedDistance = Math.round(R * c * 100) / 100;
        }

        setGeoStatus('detected');
        setGeoAccuracy(acc);
        setForm(f => ({
          ...f,
          location: locationName,
          latitude: lat,
          longitude: lon,
          accuracy: acc,
          distanceFromPrevious: estimatedDistance > 0 ? estimatedDistance : f.distanceFromPrevious,
        }));

        toast(`Location detected: ${locationName}`, 'success');
      },
      (error) => {
        let msg = 'Unable to detect your location.';
        if (error.code === 1) {
          msg = 'Location permission denied. You can continue analysis without location.';
        } else if (error.code === 2) {
          msg = 'Unable to detect your location.';
        } else if (error.code === 3) {
          msg = 'Location request timed out. Please try again.';
        }

        setGeoStatus('error');
        setGeoErrorMsg(msg);
        toast(msg, 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.amount || form.amount <= 0) e.amount = 'Amount required';
    if (!form.location) e.location = 'Location or coordinates required';
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

      // Update previous location reference for subsequent tests
      if (res.latitude !== null && res.longitude !== null && res.latitude !== undefined && res.longitude !== undefined) {
        setPrevLocation({
          hasPrevious: true,
          latitude: res.latitude,
          longitude: res.longitude,
          displayName: res.location || `Lat: ${res.latitude.toFixed(4)}, Lon: ${res.longitude.toFixed(4)}`,
          accuracy: res.accuracy || null,
        });
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'ML Service Unavailable. Please start the FraudShield ML service and try again.';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setGeoStatus('idle');
    setGeoAccuracy(null);
    setGeoErrorMsg(null);
    setForm({
      amount: 0,
      type: 'Payment',
      merchantCategory: 'Retail',
      location: '',
      latitude: null,
      longitude: null,
      accuracy: null,
      date: today,
      time: '12:00',
      accountAge: 365,
      previousTransactionAmount: 500,
      transactionFrequency: 5,
      previousFraudCount: 0,
      distanceFromPrevious: 0,
      deviceType: 'Mobile',
      ipRiskScore: 20,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">MANUAL TRANSACTION ANALYSIS</h1>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                GPS + XGBoost
              </span>
            </div>
            <p className="text-text-secondary mt-1 text-sm">
              Interactive single-transaction testing powered by automatic geolocation and the trained XGBoost model.
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
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* TRANSACTION DETAILS */}
              <section>
                <h2 className="text-sm font-semibold text-text-primary tracking-wider mb-6 border-b border-border pb-2">TRANSACTION DETAILS</h2>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  <Input label="Amount ($)" type="number" name="amount" placeholder="0.00" value={form.amount || ''} onChange={e => set('amount', parseFloat(e.target.value) || 0)} error={errors.amount} />
                  <Select label="Transaction Type" name="type" options={typeOptions} value={form.type} onChange={e => set('type', e.target.value)} />
                  <Select label="Merchant Category" name="merchantCategory" options={merchantOptions} value={form.merchantCategory} onChange={e => set('merchantCategory', e.target.value)} />
                  <Input label="Merchant URL (Optional)" type="url" name="merchantUrl" placeholder="https://..." value={form.merchantUrl || ''} onChange={e => set('merchantUrl', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                    <Input label="Date" type="date" name="date" value={form.date} onChange={e => set('date', e.target.value)} error={errors.date} />
                    <Input label="Time" type="time" name="time" value={form.time} onChange={e => set('time', e.target.value)} error={errors.time} />
                  </div>
                </div>
              </section>

              {/* AUTOMATIC LOCATION & GEOLOCATION */}
              <section className="bg-background/40 p-5 rounded-xl border border-border/60">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-text-primary tracking-wider">GEOLOCATION & DISTANCE SIGNAL</h2>
                  </div>
                  {geoStatus === 'detected' && (
                    <span className="text-xs font-semibold text-success flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Location detected ✓
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Input 
                      label="Location / City Display" 
                      name="location" 
                      placeholder="e.g. Coimbatore, Tamil Nadu, India" 
                      value={form.location} 
                      onChange={e => set('location', e.target.value)} 
                      error={errors.location} 
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={geoStatus === 'detecting'}
                      className="btn-secondary text-xs flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors font-semibold"
                    >
                      {geoStatus === 'detecting' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          Detecting Location...
                        </>
                      ) : (
                        <>
                          <Crosshair className="w-4 h-4 text-primary" />
                          Use My Current Location
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-text-secondary text-center sm:text-left">
                      Uses browser GPS coordinates to calculate authentic Haversine displacement.
                    </span>
                  </div>

                  {/* Geolocation Details Card */}
                  {geoStatus === 'detected' && form.latitude !== null && form.longitude !== null && (
                    <div className="p-3.5 bg-surface rounded-lg border border-border/70 text-xs space-y-2 animate-fade-in">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-background/60 p-2 rounded border border-border/40">
                          <span className="text-text-secondary text-[10px] uppercase font-semibold">Latitude</span>
                          <p className="font-mono text-text-primary font-bold mt-0.5">{form.latitude}</p>
                        </div>
                        <div className="bg-background/60 p-2 rounded border border-border/40">
                          <span className="text-text-secondary text-[10px] uppercase font-semibold">Longitude</span>
                          <p className="font-mono text-text-primary font-bold mt-0.5">{form.longitude}</p>
                        </div>
                        <div className="bg-background/60 p-2 rounded border border-border/40">
                          <span className="text-text-secondary text-[10px] uppercase font-semibold">Accuracy</span>
                          <p className="font-mono text-text-primary font-bold mt-0.5">±{geoAccuracy} m</p>
                        </div>
                      </div>

                      {prevLocation.hasPrevious ? (
                        <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between text-text-secondary gap-1">
                          <span>
                            Previous Txn Location: <strong className="text-text-primary">{prevLocation.displayName}</strong>
                          </span>
                          <span className="text-primary font-semibold">
                            Distance: {form.distanceFromPrevious.toFixed(2)} km
                          </span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-text-secondary pt-1 border-t border-border/50">
                          First recorded transaction with GPS. Future transactions will measure geodesic distance from here.
                        </p>
                      )}
                    </div>
                  )}

                  {geoStatus === 'error' && geoErrorMsg && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{geoErrorMsg}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* USER BEHAVIOR */}
              <section>
                <h2 className="text-sm font-semibold text-text-primary tracking-wider mb-6 border-b border-border pb-2">USER BEHAVIOR & METRICS</h2>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  <Input label="Account Age (days)" type="number" value={form.accountAge} onChange={e => set('accountAge', parseInt(e.target.value) || 0)} />
                  <Input label="Previous Txn Amount ($)" type="number" value={form.previousTransactionAmount} onChange={e => set('previousTransactionAmount', parseFloat(e.target.value) || 0)} />
                  <Input label="Txn Frequency (per day)" type="number" value={form.transactionFrequency} onChange={e => set('transactionFrequency', parseInt(e.target.value) || 0)} />
                  <Input label="Previous Fraud Count" type="number" value={form.previousFraudCount} onChange={e => set('previousFraudCount', parseInt(e.target.value) || 0)} />
                  <Input 
                    label="Distance From Prev (km)" 
                    type="number" 
                    value={form.distanceFromPrevious} 
                    onChange={e => set('distanceFromPrevious', parseFloat(e.target.value) || 0)} 
                    hint={geoStatus === 'detected' ? "Auto-computed via Haversine formula" : "Manual override / estimated km"}
                  />
                </div>
              </section>

              {/* DEVICE & NETWORK */}
              <section>
                <h2 className="text-sm font-semibold text-text-primary tracking-wider mb-6 border-b border-border pb-2">DEVICE & NETWORK TELEMETRY</h2>
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
                <p className="text-sm text-text-secondary/70 mt-2 max-w-sm">Fill out the transaction details on the left, optionally capture current GPS location, and click Analyze to view the real XGBoost ML assessment.</p>
              </div>
            )}
            
            {loading && (
              <div className="card h-full flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                <h3 className="text-xl font-medium text-text-primary mb-2 tracking-tight">AI Analysis in Progress</h3>
                <p className="text-sm text-text-secondary">Evaluating 20 real features (including Haversine distance) across trained XGBoost decision trees...</p>
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

                  {/* GEOSPATIAL SIGNAL SUMMARY */}
                  {result.distanceFromPreviousKm !== undefined && (
                    <div className="w-full mt-6 p-4 rounded-lg bg-surface/70 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Geospatial Telemetry</span>
                        </div>
                        <span className="text-xs font-mono text-primary font-bold">
                          {result.distanceFromPreviousKm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km
                        </span>
                      </div>

                      <div className="text-xs text-text-secondary space-y-1">
                        <div className="flex justify-between">
                          <span>Transaction Location:</span>
                          <span className="text-text-primary font-medium">{result.location || form.location}</span>
                        </div>
                        {result.latitude && result.longitude && (
                          <div className="flex justify-between">
                            <span>Current GPS:</span>
                            <span className="font-mono text-text-primary">{result.latitude}, {result.longitude}</span>
                          </div>
                        )}
                        {result.previousLatitude && result.previousLongitude && (
                          <div className="flex justify-between">
                            <span>Previous GPS:</span>
                            <span className="font-mono text-text-primary">{result.previousLatitude}, {result.previousLongitude}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
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
                        {(result.explanation?.evaluatedFactors || result.riskFactors).map((f, i) => {
                          const isRisk = /high|large|elevated|deviation|unusual|incident|variance|higher/i.test(f) || (result.riskScore >= 60);
                          const isModerate = /noticeable|moderate|verification|off-peak/i.test(f);
                          return (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-text-primary bg-background/60 p-2.5 rounded-lg border border-border/40">
                              {isRisk ? (
                                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                              ) : isModerate ? (
                                <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                              )}
                              <span className="leading-relaxed">{f}</span>
                            </div>
                          );
                        })}
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

                  {/* TELEMETRY FOOTER & ACTIONS */}
                  <div className="w-full mt-6 pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-text-muted">
                    <span>Evaluated: 20 features • Algorithm: XGBoost</span>
                    <div className="flex items-center gap-3">
                      {result.id && (
                        <Link to={`/transactions/${result.id}`} className="text-primary hover:underline font-semibold flex items-center gap-1">
                          View Details <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      <Link to="/transactions" className="text-text-secondary hover:text-text-primary flex items-center gap-1">
                        Transactions History
                      </Link>
                      <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1.5 text-text-secondary hover:text-text-primary ml-1">
                         <RotateCcw className="w-3.5 h-3.5" /> Reset Form
                      </button>
                    </div>
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
