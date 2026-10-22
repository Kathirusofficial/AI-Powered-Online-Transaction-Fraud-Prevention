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
  Eye,
  MapPin,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Calendar,
  Smartphone,
  IndianRupee
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PredictionBadge, RiskBadge } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import RiskGauge from '@/components/common/RiskGauge';
import { useToast } from '@/hooks/useToast';
import { 
  getMLServiceHealth, 
  getTransactions, 
  ingestTransaction,
  getLastLocation,
  type MLHealthStatus 
} from '@/services/fraudService';
import type { Transaction, TransactionType, MerchantCategory, DeviceType } from '@/types';
import { formatCurrencyINR, formatLocation, reverseGeocodeCoordinates, classNames } from '@/utils/helpers';

export interface ScenarioProfile {
  amount: number;
  previousTransactionAmount: number;
  type: TransactionType;
  merchantCategory: MerchantCategory;
  city: string;
  state: string;
  location: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  deviceType: DeviceType;
  ipRiskScore: number;
  accountAge: number;
  transactionFrequency: number;
  previousFraudCount: number;
  distanceOffsetKm?: number;
  hubDescription: string;
}

// Authentic scenario-driven Indian transaction profiles distributed across regional commercial hubs
export const INDIA_MONITOR_PROFILES: ScenarioProfile[] = [
  {
    amount: 2450, // ₹2,450
    previousTransactionAmount: 1800,
    type: 'Payment',
    merchantCategory: 'Fuel',
    city: 'Salem',
    state: 'Tamil Nadu',
    location: 'Salem, Tamil Nadu, India',
    latitude: 11.6643,
    longitude: 78.1460,
    accuracy: 18,
    deviceType: 'Mobile',
    ipRiskScore: 8,
    accountAge: 420,
    transactionFrequency: 2,
    previousFraudCount: 0,
    distanceOffsetKm: 1.2,
    hubDescription: 'Fuel & Highway Logistics Corridor'
  },
  {
    amount: 18500, // ₹18,500
    previousTransactionAmount: 12000,
    type: 'Purchase',
    merchantCategory: 'Online Shopping',
    city: 'Hyderabad',
    state: 'Telangana',
    location: 'Hyderabad, Telangana, India',
    latitude: 17.3850,
    longitude: 78.4867,
    accuracy: 12,
    deviceType: 'Mobile',
    ipRiskScore: 16,
    accountAge: 310,
    transactionFrequency: 4,
    previousFraudCount: 0,
    distanceOffsetKm: 2.5,
    hubDescription: 'E-Commerce & Cyber City Shopping'
  },
  {
    amount: 375000, // ₹3,75,000 (Simulates high-risk travel anomaly)
    previousTransactionAmount: 4200,
    type: 'Transfer',
    merchantCategory: 'Travel',
    city: 'Mumbai',
    state: 'Maharashtra',
    location: 'Mumbai, Maharashtra, India',
    latitude: 19.0760,
    longitude: 72.8777,
    accuracy: 25,
    deviceType: 'Desktop',
    ipRiskScore: 88,
    accountAge: 35,
    transactionFrequency: 14,
    previousFraudCount: 1,
    distanceOffsetKm: 650.0,
    hubDescription: 'Financial Capital & Travel Anomaly Node'
  },
  {
    amount: 3550, // ₹3,550
    previousTransactionAmount: 2900,
    type: 'Purchase',
    merchantCategory: 'Groceries',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    location: 'Coimbatore, Tamil Nadu, India',
    latitude: 11.0168,
    longitude: 76.9558,
    accuracy: 15,
    deviceType: 'Mobile',
    ipRiskScore: 10,
    accountAge: 680,
    transactionFrequency: 3,
    previousFraudCount: 0,
    distanceOffsetKm: 0.8,
    hubDescription: 'Commercial Retail & Supermarket Groceries'
  },
  {
    amount: 1450, // ₹1,450
    previousTransactionAmount: 1200,
    type: 'Payment',
    merchantCategory: 'Food & Dining',
    city: 'Madurai',
    state: 'Tamil Nadu',
    location: 'Madurai, Tamil Nadu, India',
    latitude: 9.9252,
    longitude: 78.1198,
    accuracy: 20,
    deviceType: 'Mobile',
    ipRiskScore: 5,
    accountAge: 550,
    transactionFrequency: 2,
    previousFraudCount: 0,
    distanceOffsetKm: 1.8,
    hubDescription: 'Local Dining & Food Payment District'
  },
  {
    amount: 4850, // ₹4,850
    previousTransactionAmount: 4200,
    type: 'Payment',
    merchantCategory: 'Utilities',
    city: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    location: 'Tiruchirappalli, Tamil Nadu, India',
    latitude: 10.7905,
    longitude: 78.7047,
    accuracy: 14,
    deviceType: 'Desktop',
    ipRiskScore: 12,
    accountAge: 750,
    transactionFrequency: 1,
    previousFraudCount: 0,
    distanceOffsetKm: 0.0,
    hubDescription: 'Municipal Utilities & Services Payment'
  },
  {
    amount: 125000, // ₹1,25,000 (High-ticket electronic purchase)
    previousTransactionAmount: 3500,
    type: 'Purchase',
    merchantCategory: 'Electronics',
    city: 'Bengaluru',
    state: 'Karnataka',
    location: 'Bengaluru, Karnataka, India',
    latitude: 12.9716,
    longitude: 77.5946,
    accuracy: 10,
    deviceType: 'Desktop',
    ipRiskScore: 78,
    accountAge: 45,
    transactionFrequency: 10,
    previousFraudCount: 0,
    distanceOffsetKm: 420.0,
    hubDescription: 'Tech Retail & Electronics Flagship Hub'
  },
  {
    amount: 850, // ₹850
    previousTransactionAmount: 1100,
    type: 'Payment',
    merchantCategory: 'Healthcare',
    city: 'Kochi',
    state: 'Kerala',
    location: 'Kochi, Kerala, India',
    latitude: 9.9312,
    longitude: 76.2673,
    accuracy: 16,
    deviceType: 'Mobile',
    ipRiskScore: 6,
    accountAge: 510,
    transactionFrequency: 2,
    previousFraudCount: 0,
    distanceOffsetKm: 1.1,
    hubDescription: 'Coastal Healthcare & Clinical Pharmacy'
  },
  {
    amount: 8500, // ₹8,500
    previousTransactionAmount: 6200,
    type: 'Payment',
    merchantCategory: 'Education',
    city: 'Pune',
    state: 'Maharashtra',
    location: 'Pune, Maharashtra, India',
    latitude: 18.5204,
    longitude: 73.8567,
    accuracy: 14,
    deviceType: 'Desktop',
    ipRiskScore: 14,
    accountAge: 620,
    transactionFrequency: 2,
    previousFraudCount: 0,
    distanceOffsetKm: 3.0,
    hubDescription: 'Education & Professional Training Center'
  },
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamIntervalMs, setStreamIntervalMs] = useState(6000);
  const [userLocation, setUserLocation] = useState<{
    locationName: string;
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    isRealGpsActive: boolean;
    timestamp?: number;
  }>({
    locationName: 'Detecting location...',
    latitude: null,
    longitude: null,
    accuracy: null,
    isRealGpsActive: false,
  });
  const [lockToRealGps, setLockToRealGps] = useState<boolean>(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const handleViewTxn = (txn: Transaction) => {
    setSelectedTxn(txn);
    setIsDetailModalOpen(true);
  };

  // Mutable refs to prevent stale closures and guarantee single execution loop
  const streamStateRef = useRef<'stopped' | 'running' | 'paused'>('stopped');
  const streamIntervalMsRef = useRef<number>(6000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const profileIndexRef = useRef<number>(0);
  const userLocationRef = useRef(userLocation);
  const lockToRealGpsRef = useRef<boolean>(false);

  // Keep refs synchronized
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  useEffect(() => {
    lockToRealGpsRef.current = lockToRealGps;
  }, [lockToRealGps]);

  // Check ML API Health
  const checkHealth = useCallback(async () => {
    const h = await getMLServiceHealth();
    setHealth(h);
    return h;
  }, []);

  // Dedicated function to obtain real browser location or fallback to last known database location
  const obtainUserLocation = useCallback(async (isUserInitiated: boolean = false): Promise<{
    locationName: string;
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  }> => {
    // 1. If we already have fresh valid coordinates (< 5 min old), reuse them
    const current = userLocationRef.current;
    if (current.latitude !== null && current.longitude !== null && current.timestamp && (Date.now() - current.timestamp < 300000)) {
      console.log('[Location] Reusing cached valid coordinates:', current.latitude, current.longitude, current.locationName);
      return current;
    }

    console.log('[Location] Requesting browser location');

    const getBrowserPosition = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          return reject(new Error('Geolocation is not supported by your browser'));
        }
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 120000
          }
        );
      });
    };

    try {
      const position = await getBrowserPosition();
      const lat = Number(position.coords.latitude.toFixed(6));
      const lon = Number(position.coords.longitude.toFixed(6));
      const acc = Math.round(position.coords.accuracy);

      console.log('[Location] Latitude received:', lat);
      console.log('[Location] Longitude received:', lon);
      console.log('[Location] Accuracy received:', acc);

      // Derive authentic human-readable location via reverse geocoding
      let locName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      try {
        const geo = await reverseGeocodeCoordinates(lat, lon);
        if (geo && geo.locationName && !geo.locationName.toLowerCase().includes('unavailable')) {
          locName = geo.locationName;
        }
      } catch (err) {
        console.warn('[Location] Reverse geocoding error:', err);
      }

      const resLoc = {
        locationName: locName,
        latitude: lat,
        longitude: lon,
        accuracy: acc,
        isRealGpsActive: true,
        timestamp: Date.now()
      };

      setUserLocation(resLoc);
      userLocationRef.current = resLoc;
      if (isUserInitiated) {
        toast(`Real GPS locked: ${locName}`, 'success');
      }
      return resLoc;
    } catch (err: unknown) {
      const geoErr = err as { code?: number; message?: string };
      console.warn('[Location] Browser geolocation error:', geoErr?.code, geoErr?.message);

      // Check last-location from MongoDB Atlas as graceful fallback telemetry
      try {
        const last = await getLastLocation();
        if (last && last.hasPrevious && last.location && last.location.latitude && last.location.longitude) {
          const locName = last.location.displayName
            ? formatLocation(last.location.displayName)
            : `${last.location.latitude.toFixed(4)}, ${last.location.longitude.toFixed(4)}`;

          const dbLoc = {
            locationName: locName,
            latitude: last.location.latitude,
            longitude: last.location.longitude,
            accuracy: last.location.accuracy || 15,
            isRealGpsActive: last.location.locationSource === 'REAL_GPS',
            timestamp: Date.now()
          };
          console.log('[Location] Last recorded transaction location in database:', locName);
          setUserLocation(dbLoc);
          userLocationRef.current = dbLoc;
          return dbLoc;
        }
      } catch (dbErr) {
        console.warn('[Location] Failed to fetch last location:', dbErr);
      }

      // If user denied permission or unavailable
      let statusMsg = 'Location unavailable — enable browser location permission';
      if (geoErr?.code === 1) { // PERMISSION_DENIED
        statusMsg = 'Location permission required — enable browser location permission';
        if (isUserInitiated) {
          toast('Location permission required. Please allow browser location access.', 'warning');
        }
      } else if (isUserInitiated) {
        toast('Unable to acquire GPS lock. Please check location settings.', 'warning');
      }

      const fallbackLoc = {
        locationName: statusMsg,
        latitude: null,
        longitude: null,
        accuracy: null,
        isRealGpsActive: false,
        timestamp: Date.now()
      };
      setUserLocation(fallbackLoc);
      userLocationRef.current = fallbackLoc;
      return fallbackLoc;
    }
  }, [toast]);

  // Pre-load recent transactions and initialize location on mount
  useEffect(() => {
    // 1. Initial check: load last known location from database
    getLastLocation().then(res => {
      if (res.hasPrevious && res.location && res.location.latitude && res.location.longitude) {
        const initialLoc = {
          locationName: res.location.displayName ? formatLocation(res.location.displayName) : 'Previous location',
          latitude: res.location.latitude,
          longitude: res.location.longitude,
          accuracy: res.location.accuracy || 15,
          isRealGpsActive: res.location.locationSource === 'REAL_GPS',
          timestamp: Date.now()
        };
        setUserLocation(initialLoc);
        userLocationRef.current = initialLoc;
        console.log('[Location] Initialized from previous transaction:', initialLoc.locationName);
      }
    }).catch(err => console.warn('Could not fetch initial location:', err));

    // 2. Query browser GPS if permitted (silent)
    obtainUserLocation(false);

    // 3. Pre-load recent transactions from database
    checkHealth();
    getTransactions(1, 25).then(txns => {
      if (txns && txns.length > 0) {
        setLiveTxns(txns);
      }
    }).catch(err => console.warn('Failed to load initial transactions:', err));

    const healthInterval = setInterval(checkHealth, 10000);
    return () => clearInterval(healthInterval);
  }, [checkHealth, obtainUserLocation]);

  // Process a single real transaction through backend -> ML -> MongoDB pipeline
  const processOneTransaction = useCallback(async () => {
    if (isProcessingRef.current) return;
    if (streamStateRef.current !== 'running') return;

    // Verify ML service is online
    const currentHealth = await checkHealth();
    if (currentHealth.status !== 'ok') {
      console.warn('[Monitor] ML Service is offline, stopping monitor');
      setStreamState('stopped');
      streamStateRef.current = 'stopped';
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      toast('ML Service Unavailable. Please verify the Python XGBoost service on port 8000.', 'error');
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);

    const profile = INDIA_MONITOR_PROFILES[profileIndexRef.current % INDIA_MONITOR_PROFILES.length];
    profileIndexRef.current += 1;

    try {
      console.log(`[Monitor] Processing transaction: ₹${profile.amount} (${profile.merchantCategory}) - ${profile.city}`);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateStr = now.toISOString().split('T')[0];

      // Maintain clear distinction:
      // - REAL USER TRANSACTION: If lockToRealGps is enabled AND real browser GPS is active,
      //   use real coordinates and reverse-geocoded location with locationSource = 'REAL_GPS'.
      // - AUTOMATED DEMO TRANSACTION: When running Live Monitor scenarios and real GPS is not explicitly active,
      //   use the deterministic scenario profile's authentic Indian location with locationSource = 'SCENARIO_PROFILE'.
      const isUsingRealGps = lockToRealGpsRef.current && 
        userLocationRef.current.isRealGpsActive && 
        userLocationRef.current.latitude !== null && 
        userLocationRef.current.longitude !== null;

      const txnLoc = isUsingRealGps ? userLocationRef.current.locationName : profile.location;
      const txnLat = isUsingRealGps ? userLocationRef.current.latitude : profile.latitude;
      const txnLon = isUsingRealGps ? userLocationRef.current.longitude : profile.longitude;
      const txnAccuracy = isUsingRealGps ? userLocationRef.current.accuracy : profile.accuracy;
      const locationSource = isUsingRealGps ? 'REAL_GPS' : 'SCENARIO_PROFILE';

      console.log('[Monitor] Attaching location to transaction:', txnLoc, 'Lat:', txnLat, 'Lon:', txnLon, 'Source:', locationSource);

      console.log('[Monitor] Sending transaction to API /api/transactions/analyze');
      const { transaction } = await ingestTransaction({
        amount: profile.amount,
        previousTransactionAmount: profile.previousTransactionAmount,
        type: profile.type,
        merchantCategory: profile.merchantCategory,
        location: txnLoc,
        locationSource: locationSource,
        latitude: txnLat,
        longitude: txnLon,
        accuracy: txnAccuracy,
        date: dateStr,
        time: timeStr,
        accountAge: profile.accountAge,
        transactionFrequency: profile.transactionFrequency,
        previousFraudCount: profile.previousFraudCount,
        distanceFromPrevious: profile.distanceOffsetKm || 0,
        deviceType: profile.deviceType,
        ipRiskScore: profile.ipRiskScore,
      });

      console.log('[Monitor] Transaction persisted in MongoDB Atlas:', transaction.id, 'Location:', transaction.location, 'Source:', transaction.locationSource, 'Prediction:', transaction.prediction);

      // Prepend the real persisted transaction to the live feed
      setLiveTxns(prev => [transaction, ...prev.slice(0, 49)]);

      if (transaction.prediction === 'Fraud' || transaction.riskLevel === 'Critical') {
        toast(`⚠️ Fraud Detected: ${formatCurrencyINR(transaction.amount)} (${transaction.merchantCategory}) - Risk Score ${transaction.riskScore}/100`, 'error');
      } else if (transaction.prediction === 'Suspicious') {
        toast(`⚠️ Suspicious Transaction: ${formatCurrencyINR(transaction.amount)} (${transaction.merchantCategory}) - Risk Score ${transaction.riskScore}/100`, 'warning');
      }
    } catch (err: unknown) {
      console.error('[Monitor] Ingestion error:', err);
      const errMsg = (err as { response?: { data?: { msg?: string } }; message?: string })?.response?.data?.msg || (err as Error)?.message || 'Transaction ingestion failed';
      toast(errMsg, 'error');
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [checkHealth, toast]);

  // Schedule next ingestion tick without overlapping executions
  const scheduleNext = useCallback((delayMs: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (streamStateRef.current !== 'running') {
      return;
    }

    console.log(`[Monitor] Next ingestion scheduled in ${delayMs / 1000}s`);
    timerRef.current = setTimeout(async () => {
      if (streamStateRef.current === 'running') {
        await processOneTransaction();
        if (streamStateRef.current === 'running') {
          scheduleNext(streamIntervalMsRef.current);
        }
      }
    }, delayMs);
  }, [processOneTransaction]);

  // START MONITORING
  const handleStart = async () => {
    console.log('[Monitor] START clicked');
    const h = await checkHealth();
    if (h.status !== 'ok') {
      toast('ML Service Unavailable. Please start the FraudShield FastAPI service on port 8000.', 'error');
      return;
    }

    if (streamStateRef.current === 'running') return;

    // Ensure we have user location before starting ingestion loop!
    let currentLoc = userLocationRef.current;
    if (currentLoc.latitude === null || currentLoc.longitude === null) {
      toast('Acquiring real browser location...', 'info');
      currentLoc = await obtainUserLocation(true);
    }

    setStreamState('running');
    streamStateRef.current = 'running';
    toast('Transaction monitoring stream started', 'success');

    console.log('[Monitor] Ingestion loop started: processing first transaction');
    await processOneTransaction();

    if (streamStateRef.current === 'running') {
      scheduleNext(streamIntervalMsRef.current);
    }
  };

  // PAUSE MONITORING
  const handlePause = () => {
    console.log('[Monitor] PAUSE clicked');
    setStreamState('paused');
    streamStateRef.current = 'paused';
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    toast('Transaction monitoring stream paused', 'info');
  };

  // STOP MONITORING
  const handleStop = () => {
    console.log('[Monitor] STOP clicked');
    setStreamState('stopped');
    streamStateRef.current = 'stopped';
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    toast('Transaction monitoring stream stopped', 'info');
  };

  // INTERVAL SPEED CHANGE
  const handleIntervalChange = (newInterval: number) => {
    setStreamIntervalMs(newInterval);
    streamIntervalMsRef.current = newInterval;
    if (streamStateRef.current === 'running') {
      console.log(`[Monitor] Ingestion speed changed to ${newInterval / 1000}s, rescheduling`);
      scheduleNext(newInterval);
    }
  };

  // Ensure timer cleanup on component unmount
  useEffect(() => {
    return () => {
      streamStateRef.current = 'stopped';
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Dynamic KPI Stats calculation from live feed
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

        {/* LIVE MONITOR NOTICE BANNER */}
        <div className="p-4 rounded-lg bg-surface border border-border flex items-start gap-3 text-xs text-text-secondary">
          <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary">Real-Time Ingestion & Telemetry Monitor: </span>
            Continuous monitoring engine actively tracking verified transactions, evaluating XGBoost inference metrics, Haversine geospatial displacement, and risk classifications in real time.
          </div>
        </div>

        {/* GEOLOCATION TELEMETRY STATUS BANNER */}
        <div className={classNames(
          "p-4 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs transition-colors",
          lockToRealGps && userLocation.isRealGpsActive
            ? "bg-success/5 border-success/30 text-text-secondary" 
            : "bg-surface border-border text-text-secondary"
        )}>
          <div className="flex items-start sm:items-center gap-3">
            <span className={classNames(
              "w-2.5 h-2.5 rounded-full shrink-0 mt-1 sm:mt-0",
              lockToRealGps && userLocation.isRealGpsActive ? "bg-success animate-pulse" : "bg-primary"
            )} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                  {lockToRealGps && userLocation.isRealGpsActive ? 'Active Stream Mode: Real Browser GPS' : 'Active Stream Mode: Multi-Hub Indian Scenarios'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-background border border-border text-text-muted">
                  {lockToRealGps && userLocation.isRealGpsActive ? 'Source: REAL_GPS' : 'Source: SCENARIO_PROFILE'}
                </span>
              </div>
              <p className="text-text-secondary mt-1">
                {lockToRealGps && userLocation.isRealGpsActive ? (
                  <>Locked to browser coordinates: <span className="text-text-primary font-medium">{userLocation.locationName}</span> {userLocation.accuracy ? `(±${userLocation.accuracy}m)` : ''}</>
                ) : (
                  <>Streaming authentic Indian commercial hubs: <span className="text-text-primary font-medium">Salem, Hyderabad, Mumbai, Coimbatore, Madurai, Tiruchirappalli, Bengaluru, Kochi, Pune</span></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {userLocation.isRealGpsActive ? (
              <button
                type="button"
                onClick={() => setLockToRealGps(prev => !prev)}
                className={classNames(
                  "px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors border",
                  lockToRealGps 
                    ? "bg-primary text-background border-primary" 
                    : "bg-surface hover:bg-border text-text-primary border-border"
                )}
              >
                {lockToRealGps ? '✓ Locked to GPS' : 'Lock to Real GPS'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => obtainUserLocation(true)}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Detect Real GPS
              </button>
            )}
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
              onChange={e => handleIntervalChange(Number(e.target.value))}
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
                      <td className="px-4 py-3.5 font-semibold text-text-primary">{formatCurrencyINR(txn.amount)}</td>
                      <td className="px-4 py-3.5 text-text-secondary text-xs">{txn.merchantCategory}</td>
                      <td className="px-4 py-3.5 text-xs text-text-secondary">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-text-primary">{formatLocation(txn.location)}</span>
                          {txn.locationSource === 'REAL_GPS' ? (
                            <span className="text-[10px] text-success font-semibold px-1.5 py-0.5 rounded bg-success/10 border border-success/30 font-mono">
                              GPS
                            </span>
                          ) : (
                            <span className="text-[10px] text-primary font-semibold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 font-mono">
                              HUB
                            </span>
                          )}
                        </div>
                        {txn.latitude !== null && txn.longitude !== null && (
                          <div className="text-[10px] text-text-muted font-mono mt-0.5">
                            {txn.latitude.toFixed(4)}, {txn.longitude.toFixed(4)}
                          </div>
                        )}
                      </td>
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
                        <button
                          type="button"
                          onClick={() => handleViewTxn(txn)}
                          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <Modal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Transaction Security Analysis — ${selectedTxn.id}`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="btn-ghost text-xs"
              >
                Close
              </button>
              <Link
                to={`/transactions/${selectedTxn.id}`}
                className="btn-primary text-xs inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Full Page
              </Link>
            </div>
          }
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Overview & Risk Gauge */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 card p-4 bg-ink-900/60 border border-ink-800">
                <h4 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-accent-500 rounded-sm" /> Transaction Overview
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Transaction ID', value: selectedTxn.id, icon: Activity },
                    { label: 'Amount', value: formatCurrencyINR(selectedTxn.amount), icon: IndianRupee },
                    { label: 'Type', value: selectedTxn.type, icon: Activity },
                    { label: 'Merchant', value: selectedTxn.merchantCategory, icon: Activity },
                    { label: 'Date', value: selectedTxn.date, icon: Calendar },
                    { label: 'Time', value: selectedTxn.time, icon: Clock },
                    { label: 'Location', value: formatLocation(selectedTxn.location), icon: MapPin },
                    ...(selectedTxn.latitude && selectedTxn.longitude ? [
                      { label: 'GPS Coordinates', value: `${selectedTxn.latitude.toFixed(4)}, ${selectedTxn.longitude.toFixed(4)}`, icon: MapPin }
                    ] : []),
                    ...(selectedTxn.locationSource ? [
                      {
                        label: 'Location Source',
                        value: selectedTxn.locationSource === 'REAL_GPS'
                          ? 'Real Browser GPS'
                          : selectedTxn.locationSource === 'SCENARIO_PROFILE'
                            ? 'Scenario Profile (India Hub)'
                            : selectedTxn.locationSource === 'MANUAL_ENTRY'
                              ? 'Manual Test Entry'
                              : 'Scenario Profile',
                        icon: MapPin
                      }
                    ] : []),
                    { label: 'Device', value: selectedTxn.deviceType, icon: Smartphone },
                  ].map(f => {
                    const Icon = f.icon;
                    return (
                      <div key={f.label} className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-ink-800 flex items-center justify-center text-ink-400 shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-ink-400 truncate">{f.label}</p>
                          <p className="text-xs text-ink-100 font-medium truncate">{f.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-4 bg-ink-900/60 border border-ink-800 flex flex-col items-center justify-center">
                <RiskGauge
                  score={selectedTxn.riskScore}
                  level={
                    String(selectedTxn.riskLevel || '').toLowerCase().includes('crit') ? 'Critical' :
                    String(selectedTxn.riskLevel || '').toLowerCase().includes('high') ? 'High' :
                    String(selectedTxn.riskLevel || '').toLowerCase().includes('med') ? 'Medium' : 'Low'
                  }
                  size={130}
                />
                <div className="flex items-center gap-1.5 mt-3">
                  <PredictionBadge prediction={selectedTxn.prediction} />
                  <RiskBadge
                    level={
                      String(selectedTxn.riskLevel || '').toLowerCase().includes('crit') ? 'Critical' :
                      String(selectedTxn.riskLevel || '').toLowerCase().includes('high') ? 'High' :
                      String(selectedTxn.riskLevel || '').toLowerCase().includes('med') ? 'Medium' : 'Low'
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mt-3">
                  <div className="bg-ink-850 rounded p-2 text-center">
                    <p className="text-[10px] text-ink-400">ML Probability</p>
                    <p className="text-sm font-bold text-ink-100">{selectedTxn.fraudProbability}%</p>
                  </div>
                  <div className="bg-ink-850 rounded p-2 text-center">
                    <p className="text-[10px] text-ink-400">Status</p>
                    <p className="text-xs font-semibold text-ink-200 mt-0.5">{selectedTxn.status}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Behavioral Analysis */}
            <div className="card p-4 bg-ink-900/60 border border-ink-800">
              <h4 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-accent-500 rounded-sm" /> Behavioral & Geolocation Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { label: 'Txn Frequency', value: `${selectedTxn.transactionFrequency}/day` },
                  { label: 'Previous Amount', value: formatCurrencyINR(selectedTxn.previousTransactionAmount) },
                  { label: 'Account Age', value: `${selectedTxn.accountAge} days` },
                  { label: 'Location Distance', value: `${(selectedTxn.distanceFromPreviousKm !== undefined ? selectedTxn.distanceFromPreviousKm : selectedTxn.distanceFromPrevious).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km` },
                  { label: 'IP Risk Score', value: `${selectedTxn.ipRiskScore}/100` },
                ].map(f => (
                  <div key={f.label} className="bg-ink-850 rounded p-2.5">
                    <p className="text-[10px] text-ink-400">{f.label}</p>
                    <p className="text-xs font-semibold text-ink-100 mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors & Timeline */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card p-4 bg-ink-900/60 border border-ink-800">
                <h4 className="text-xs font-bold text-critical-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-critical-500 rounded-sm" /> Dynamic Risk Factors
                </h4>
                <div className="space-y-2">
                  {(selectedTxn.riskFactors || []).map((factor, idx) => {
                    const isRisk = /high|large|elevated|deviation|unusual|incident|variance|higher/i.test(factor) || (selectedTxn.riskScore >= 60);
                    const isModerate = /noticeable|moderate|verification|off-peak/i.test(factor);
                    return (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded bg-ink-850 border border-ink-800 text-xs">
                        {isRisk ? (
                          <AlertCircle className="w-4 h-4 text-critical-500 shrink-0 mt-0.5" />
                        ) : isModerate ? (
                          <AlertTriangle className="w-4 h-4 text-warning-500 shrink-0 mt-0.5" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-success-500 shrink-0 mt-0.5" />
                        )}
                        <span className="text-ink-200">{factor}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-4 bg-ink-900/60 border border-ink-800">
                <h4 className="text-xs font-bold text-accent-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-accent-500 rounded-sm" /> Processing Timeline
                </h4>
                <div className="space-y-3">
                  {(selectedTxn.timeline || []).map((event, idx) => (
                    <div key={idx} className="flex gap-2.5">
                      <div className="flex flex-col items-center">
                        <span className={`w-2 h-2 rounded-full ${event.status === 'danger' ? 'bg-critical-500' : event.status === 'warning' ? 'bg-warning-500' : 'bg-accent-500'}`} />
                        {idx < selectedTxn.timeline.length - 1 && <span className="w-px flex-1 bg-ink-700 my-0.5" />}
                      </div>
                      <div className="pb-0.5 text-xs">
                        <p className="text-ink-100 font-medium">{event.event}</p>
                        <p className="text-[10px] text-ink-400">{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
