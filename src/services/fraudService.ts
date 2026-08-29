import type { Transaction, Alert, DashboardStats, AdminStats, AnalyzeResult, RiskLevel, Prediction } from '../types';
import { mockUsers } from '../data/mockData';
import { getRiskLevel } from '../utils/helpers';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ML_API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ML_API_URL) || 'http://localhost:8000';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface AnalyzeInput {
  amount: number;
  type: string;
  merchantCategory: string;
  merchantUrl?: string;
  location: string;
  date: string;
  time: string;
  accountAge: number;
  previousTransactionAmount: number;
  transactionFrequency: number;
  previousFraudCount: number;
  distanceFromPrevious: number;
  deviceType: string;
  ipRiskScore: number;
  userId?: string;
  userName?: string;
}

// Helpers for Supabase <-> Domain object mapping
function mapRowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    userId: row.user_id || 'U0001',
    userName: row.user_name || 'Current User',
    amount: Number(row.amount),
    type: row.type,
    merchantCategory: row.merchant_category,
    merchantUrl: row.merchant_url || undefined,
    location: row.location,
    date: row.date,
    time: row.time,
    riskScore: Number(row.risk_score),
    fraudProbability: Number(row.fraud_probability),
    prediction: row.prediction,
    riskLevel: row.risk_level,
    status: row.status,
    accountAge: Number(row.account_age || 0),
    previousTransactionAmount: Number(row.previous_transaction_amount || 0),
    transactionFrequency: Number(row.transaction_frequency || 0),
    previousFraudCount: Number(row.previous_fraud_count || 0),
    distanceFromPrevious: Number(row.distance_from_previous || 0),
    deviceType: row.device_type || 'Mobile',
    ipRiskScore: Number(row.ip_risk_score || 0),
    riskFactors: Array.isArray(row.risk_factors)
      ? row.risk_factors
      : typeof row.risk_factors === 'string'
      ? JSON.parse(row.risk_factors)
      : [],
    timeline: Array.isArray(row.timeline)
      ? row.timeline
      : typeof row.timeline === 'string'
      ? JSON.parse(row.timeline)
      : [],
    modelVersion: row.model_version || undefined,
  };
}

function mapTransactionToRow(txn: Transaction) {
  return {
    id: txn.id,
    user_id: txn.userId,
    user_name: txn.userName,
    amount: txn.amount,
    type: txn.type,
    merchant_category: txn.merchantCategory,
    merchant_url: txn.merchantUrl || null,
    location: txn.location,
    date: txn.date,
    time: txn.time,
    risk_score: txn.riskScore,
    fraud_probability: txn.fraudProbability,
    prediction: txn.prediction,
    risk_level: txn.riskLevel,
    status: txn.status,
    account_age: txn.accountAge,
    previous_transaction_amount: txn.previousTransactionAmount,
    transaction_frequency: txn.transactionFrequency,
    previous_fraud_count: txn.previousFraudCount,
    distance_from_previous: txn.distanceFromPrevious,
    device_type: txn.deviceType,
    ip_risk_score: txn.ipRiskScore,
    risk_factors: txn.riskFactors,
    timeline: txn.timeline,
  };
}

// Helpers for storage fallback persistence
let memoryTransactions: Transaction[] = [];

function getStoredTransactions(): Transaction[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      const stored = window.localStorage.getItem('sentinel_transactions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } else if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const stored = localStorage.getItem('sentinel_transactions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse transactions from local storage', e);
  }
  return memoryTransactions;
}

function saveStoredTransactions(txns: Transaction[]) {
  memoryTransactions = [...txns];
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem('sentinel_transactions', JSON.stringify(txns));
    } else if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem('sentinel_transactions', JSON.stringify(txns));
    }
  } catch (e) {
    console.error('Failed to save transactions to local storage', e);
  }
}

export async function analyzeTransaction(input: AnalyzeInput): Promise<AnalyzeResult> {
  const payload = {
    amount: Number(input.amount),
    merchantCategory: input.merchantCategory,
    location: input.location,
    date: input.date,
    time: input.time,
    accountAge: Number(input.accountAge),
    distanceFromPrevious: Number(input.distanceFromPrevious),
    deviceType: input.deviceType,
    ipRiskScore: Number(input.ipRiskScore),
    type: input.type,
  };

  let mlData: {
    fraud_probability: number;
    risk_score: number;
    prediction: string;
    risk_level: string;
    model_version: string;
    feature_count: number;
    explanation?: {
      summary: string;
      evaluated_factors: string[];
      model_feature_importance: Array<{
        feature: string;
        label: string;
        importance: number;
        value?: any;
      }>;
    };
  };

  try {
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const detail = errorJson?.detail || `HTTP ${response.status}`;
      throw new Error(`ML prediction error: ${detail}`);
    }

    mlData = await response.json();
  } catch (err: any) {
    console.error('ML API request failed:', err);
    throw new Error('ML Service Unavailable. Please start the FraudShield ML service and try again.');
  }

  // Derive domain metrics directly from real ML prediction response
  const fraudProbability = Math.round(mlData.fraud_probability * 1000) / 10;
  const riskScore = mlData.risk_score;
  const prediction: Prediction = mlData.prediction === 'Fraud' ? 'Fraud' : (mlData.risk_score >= 40 ? 'Suspicious' : 'Genuine');
  const riskLevel: RiskLevel = (mlData.risk_level as RiskLevel) || getRiskLevel(riskScore);

  // Derive honest, model-supported explanatory risk factors based on real feature inputs
  const factors: string[] = mlData.explanation?.evaluated_factors && mlData.explanation.evaluated_factors.length > 0
    ? mlData.explanation.evaluated_factors
    : [];

  if (factors.length === 0) {
    const transHour = parseInt(input.time?.split(':')[0] || '12', 10);
    if (input.amount > 3000) {
      factors.push('Transaction amount is significantly above average');
    } else if (input.amount > 1000) {
      factors.push('Transaction amount is moderately elevated');
    }
    if (input.distanceFromPrevious > 500) {
      factors.push('Significant geographic distance between transaction and cardholder');
    }
    if (transHour >= 0 && transHour <= 5) {
      factors.push('Transaction initiated during high-risk late-night hours (00:00–05:00)');
    }
    if (factors.length === 0) {
      factors.push(riskScore >= 50 ? 'Model detected statistical behavioral pattern anomaly' : 'Transaction matches normal behavioral patterns');
    }
  }

  const result: AnalyzeResult = {
    riskLevel,
    prediction,
    fraudProbability,
    riskScore,
    riskFactors: factors,
    modelVersion: mlData.model_version,
    explanation: mlData.explanation ? {
      summary: mlData.explanation.summary,
      evaluatedFactors: mlData.explanation.evaluated_factors,
      topModelFeatures: mlData.explanation.model_feature_importance.map(f => ({
        feature: f.feature,
        label: f.label,
        importance: f.importance,
        value: f.value,
      })),
    } : undefined,
  };

  // Create new transaction domain object
  const newTxn: Transaction = {
    id: `TXN${String(Math.floor(Math.random() * 90000) + 10000)}`,
    userId: input.userId || 'U0001',
    userName: input.userName || 'Current User',
    amount: input.amount,
    type: input.type as any,
    merchantCategory: input.merchantCategory as any,
    merchantUrl: input.merchantUrl,
    location: input.location,
    date: input.date,
    time: input.time,
    riskScore: result.riskScore,
    fraudProbability: result.fraudProbability,
    prediction: result.prediction,
    riskLevel: result.riskLevel,
    status: result.prediction === 'Fraud' ? 'Blocked' : (result.prediction === 'Suspicious' ? 'Reviewed' : 'Resolved'),
    accountAge: input.accountAge,
    previousTransactionAmount: input.previousTransactionAmount,
    transactionFrequency: input.transactionFrequency,
    previousFraudCount: input.previousFraudCount,
    distanceFromPrevious: input.distanceFromPrevious,
    deviceType: input.deviceType as any,
    ipRiskScore: input.ipRiskScore,
    riskFactors: result.riskFactors,
    timeline: [
      { time: `${input.date} ${input.time}`, event: 'Transaction initiated', status: 'info' },
      { time: `${input.date} ${input.time}`, event: `AI Risk Assessment completed (${result.modelVersion || 'v1.0.0'})`, status: result.riskLevel === 'Low' ? 'info' : 'warning' }
    ],
    modelVersion: result.modelVersion,
  };

  // Always update localStorage fallback cache
  const currentTxns = getStoredTransactions();
  currentTxns.unshift(newTxn);
  saveStoredTransactions(currentTxns);

  // Persist to Supabase if client is configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([mapTransactionToRow(newTxn)]);
      if (error) {
        console.error('Supabase transaction insert failed:', error.message);
      }
    } catch (err) {
      console.error('Supabase connection error on insert:', err);
    }
  }

  return result;
}

export async function getTransactions(): Promise<Transaction[]> {
  await delay(200);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const remoteTxns = data.map(mapRowToTransaction);
        // Sync local cache with remote transactions
        saveStoredTransactions(remoteTxns);
        return remoteTxns;
      }
      if (error) {
        console.warn('Supabase getTransactions failed, returning local storage fallback:', error.message);
      }
    } catch (err) {
      console.warn('Supabase connection error, returning local storage fallback:', err);
    }
  }

  return getStoredTransactions();
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  await delay(150);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return mapRowToTransaction(data);
      }
    } catch (err) {
      console.warn('Supabase getTransactionById error, checking local storage fallback:', err);
    }
  }

  const txn = getStoredTransactions().find(t => t.id === id);
  return txn ? { ...txn } : null;
}

export async function getAlerts(): Promise<Alert[]> {
  const txns = await getTransactions();
  return txns
    .filter(t => t.prediction !== 'Genuine')
    .map((t, i) => ({
      id: `ALT${String(5000 + i).padStart(5, '0')}`,
      title: t.prediction === 'Fraud' ? `Fraud Detected — ${t.id}` : `Suspicious Activity — ${t.id}`,
      transactionId: t.id,
      riskScore: t.riskScore,
      severity: (t.riskLevel === 'Critical' ? 'Critical' : t.riskLevel === 'High' ? 'High' : t.riskLevel === 'Medium' ? 'Medium' : 'Low') as Alert['severity'],
      description: t.riskFactors[0] || 'Suspicious transaction pattern detected',
      time: `${t.date} ${t.time}`,
      read: false,
    }));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const txns = await getTransactions();
  const total = txns.length;
  const genuine = txns.filter(t => t.prediction === 'Genuine').length;
  const suspicious = txns.filter(t => t.prediction === 'Suspicious').length;
  const fraud = txns.filter(t => t.prediction === 'Fraud').length;
  const fraudRate = total > 0 ? Math.round((fraud / total) * 10000) / 100 : 0;

  return {
    totalTransactions: total,
    genuine,
    suspicious,
    fraud,
    fraudRate,
    trends: {
      totalTransactions: 0,
      genuine: 0,
      suspicious: 0,
      fraud: 0,
      fraudRate: 0,
    },
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const txns = await getTransactions();
  const total = txns.length;
  const suspicious = txns.filter(t => t.prediction === 'Suspicious').length;
  const fraud = txns.filter(t => t.prediction === 'Fraud').length;
  const fraudRate = total > 0 ? Math.round((fraud / total) * 10000) / 100 : 0;
  const alerts = txns.filter(t => t.prediction !== 'Genuine').length;

  return {
    totalUsers: mockUsers.length,
    totalTransactions: total,
    fraudCases: fraud,
    suspiciousCases: suspicious,
    fraudRate,
    activeAlerts: alerts,
  };
}

export interface MLHealthStatus {
  status: 'ok' | 'offline';
  model_loaded: boolean;
  model_version: string;
  feature_count: number;
  algorithm: string;
}

export async function getMLServiceHealth(): Promise<MLHealthStatus> {
  try {
    const res = await fetch(`${ML_API_URL}/health`);
    if (!res.ok) throw new Error('Unhealthy');
    const data = await res.json();
    return {
      status: 'ok',
      model_loaded: Boolean(data.model_loaded),
      model_version: data.model_version || 'v1.0.0',
      feature_count: data.feature_count || 20,
      algorithm: data.algorithm || 'XGBoost Classifier',
    };
  } catch (e) {
    return {
      status: 'offline',
      model_loaded: false,
      model_version: 'Unavailable',
      feature_count: 0,
      algorithm: 'Unavailable',
    };
  }
}

export const DEMO_TRANSACTION_PROFILES: AnalyzeInput[] = [
  {
    amount: 18.50,
    type: 'Payment',
    merchantCategory: 'Groceries',
    location: 'Los Angeles, US',
    date: new Date().toISOString().split('T')[0],
    time: '13:00',
    accountAge: 365,
    previousTransactionAmount: 22.0,
    transactionFrequency: 3,
    previousFraudCount: 0,
    distanceFromPrevious: 2.0,
    deviceType: 'Mobile',
    ipRiskScore: 12,
    userName: 'David Miller',
    userId: 'U_david_m'
  },
  {
    amount: 42.80,
    type: 'Payment',
    merchantCategory: 'Food & Dining',
    location: 'San Francisco, US',
    date: new Date().toISOString().split('T')[0],
    time: '19:30',
    accountAge: 720,
    previousTransactionAmount: 35.0,
    transactionFrequency: 2,
    previousFraudCount: 0,
    distanceFromPrevious: 4.5,
    deviceType: 'Mobile',
    ipRiskScore: 15,
    userName: 'Elena Rostova',
    userId: 'U_elena_r'
  },
  {
    amount: 4500.00,
    type: 'Transfer',
    merchantCategory: 'Travel',
    location: 'Overseas Terminal',
    date: new Date().toISOString().split('T')[0],
    time: '02:15',
    accountAge: 45,
    previousTransactionAmount: 50.0,
    transactionFrequency: 15,
    previousFraudCount: 1,
    distanceFromPrevious: 1500.0,
    deviceType: 'Unknown',
    ipRiskScore: 90,
    userName: 'Marcus Vance',
    userId: 'U_marcus_v'
  },
  {
    amount: 1250.00,
    type: 'Purchase',
    merchantCategory: 'Online',
    location: 'Miami, US',
    date: new Date().toISOString().split('T')[0],
    time: '03:45',
    accountAge: 90,
    previousTransactionAmount: 80.0,
    transactionFrequency: 8,
    previousFraudCount: 0,
    distanceFromPrevious: 650.0,
    deviceType: 'Desktop',
    ipRiskScore: 75,
    userName: 'Chloe Bennett',
    userId: 'U_chloe_b'
  },
  {
    amount: 8.50,
    type: 'Payment',
    merchantCategory: 'Gas',
    location: 'Chicago, US',
    date: new Date().toISOString().split('T')[0],
    time: '08:15',
    accountAge: 500,
    previousTransactionAmount: 15.0,
    transactionFrequency: 1,
    previousFraudCount: 0,
    distanceFromPrevious: 1.2,
    deviceType: 'Mobile',
    ipRiskScore: 8,
    userName: 'Sarah Jenkins',
    userId: 'U_sarah_j'
  },
  {
    amount: 3200.00,
    type: 'Purchase',
    merchantCategory: 'Electronics',
    location: 'New York, US',
    date: new Date().toISOString().split('T')[0],
    time: '01:30',
    accountAge: 60,
    previousTransactionAmount: 120.0,
    transactionFrequency: 11,
    previousFraudCount: 0,
    distanceFromPrevious: 820.0,
    deviceType: 'Tablet',
    ipRiskScore: 80,
    userName: 'Alex Mercer',
    userId: 'U_alex_m'
  }
];

export async function ingestTransaction(input: AnalyzeInput): Promise<{ result: AnalyzeResult; transaction: Transaction }> {
  const result = await analyzeTransaction(input);
  const txns = await getTransactions();
  const transaction = txns[0] || {
    id: `TXN${String(Math.floor(Math.random() * 90000) + 10000)}`,
    userId: input.userId || 'U0001',
    userName: input.userName || 'Demo Stream User',
    amount: input.amount,
    type: input.type as any,
    merchantCategory: input.merchantCategory as any,
    location: input.location,
    date: input.date,
    time: input.time,
    riskScore: result.riskScore,
    fraudProbability: result.fraudProbability,
    prediction: result.prediction,
    riskLevel: result.riskLevel,
    status: (result.riskLevel === 'Critical' ? 'Flagged' : result.riskLevel === 'High' ? 'Reviewed' : 'Pending') as any,
    accountAge: input.accountAge,
    previousTransactionAmount: input.previousTransactionAmount,
    transactionFrequency: input.transactionFrequency,
    previousFraudCount: input.previousFraudCount,
    distanceFromPrevious: input.distanceFromPrevious,
    deviceType: input.deviceType as any,
    ipRiskScore: input.ipRiskScore,
    riskFactors: result.riskFactors,
    timeline: [],
    modelVersion: result.modelVersion,
  };
  return { result, transaction };
}
