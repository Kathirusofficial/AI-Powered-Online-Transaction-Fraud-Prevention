import axios from 'axios';
import type { Transaction, Alert, DashboardStats, AdminStats, AnalyzeResult, User, AccountStatus } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

export interface AnalyzeInput {
  amount: number;
  type: string;
  merchantCategory: string;
  merchantUrl?: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
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

export interface PaginatedTransactionsResponse {
  transactions: Transaction[];
  total: number;
  totalPages: number;
  page: number;
}

export async function getUsers(): Promise<User[]> {
  const response = await axios.get(`${API_URL}/users`);
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

export async function updateUserStatus(id: string, status: AccountStatus): Promise<User> {
  const response = await axios.patch(`${API_URL}/users/${id}/status`, { status });
  return response.data;
}

export async function updatePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ msg: string }> {
  const response = await axios.put(`${API_URL}/auth/password`, { currentPassword, newPassword, confirmPassword });
  return response.data;
}

export async function analyzeTransaction(input: AnalyzeInput): Promise<Transaction> {
  const response = await axios.post(`${API_URL}/transactions/analyze`, input);
  return response.data;
}

export async function ingestTransaction(input: AnalyzeInput): Promise<{ result: AnalyzeResult; transaction: Transaction }> {
  const transaction = await analyzeTransaction(input);
  const result: AnalyzeResult = {
    riskLevel: transaction.riskLevel,
    prediction: transaction.prediction,
    fraudProbability: transaction.fraudProbability,
    riskScore: transaction.riskScore,
    riskFactors: transaction.riskFactors || [],
    modelVersion: transaction.modelVersion,
    latitude: transaction.latitude,
    longitude: transaction.longitude,
    accuracy: transaction.accuracy,
    previousLatitude: transaction.previousLatitude,
    previousLongitude: transaction.previousLongitude,
    distanceFromPreviousKm: transaction.distanceFromPreviousKm,
    location: transaction.location,
  };
  return { result, transaction };
}

export async function getLastLocation(): Promise<{ hasPrevious: boolean; location: { latitude: number; longitude: number; accuracy?: number; displayName?: string; date?: string; time?: string; transactionId?: string } | null }> {
  try {
    const response = await axios.get(`${API_URL}/transactions/last-location`);
    return response.data;
  } catch (err) {
    console.warn('Failed to fetch last transaction location:', err);
    return { hasPrevious: false, location: null };
  }
}

// Returns a simple array of transactions for pages/charts that expect Transaction[]
export async function getTransactions(page: number = 1, limit: number = 100, search?: string): Promise<Transaction[]> {
  try {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    const response = await axios.get(`${API_URL}/transactions`, { params });
    if (response.data && Array.isArray(response.data.transactions)) {
      return response.data.transactions;
    }
    return [];
  } catch (err) {
    console.warn('Failed to fetch transactions from API:', err);
    return [];
  }
}

// Returns paginated metadata for the Transactions page
export async function getPaginatedTransactions(page: number = 1, limit: number = 10, search?: string, filter?: string): Promise<PaginatedTransactionsResponse> {
  try {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    if (filter && filter !== 'all') params.filter = filter;
    const response = await axios.get(`${API_URL}/transactions`, { params });
    return response.data || { transactions: [], total: 0, totalPages: 1, page: 1 };
  } catch (err) {
    console.warn('Failed to fetch paginated transactions from API:', err);
    return { transactions: [], total: 0, totalPages: 1, page: 1 };
  }
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  try {
    const response = await axios.get(`${API_URL}/transactions/${id}`);
    return response.data;
  } catch (e) {
    console.warn(`Failed to fetch transaction with id ${id}:`, e);
    return null;
  }
}

export async function getAlerts(): Promise<Alert[]> {
  try {
    const txns = await getTransactions(1, 100);
    return txns
      .filter(t => t.prediction !== 'Genuine')
      .map((t, i) => ({
        id: `ALT${String(5000 + i).padStart(5, '0')}`,
        title: t.prediction === 'Fraud' ? `Fraud Detected — ${t.id}` : `Suspicious Activity — ${t.id}`,
        transactionId: t.id,
        riskScore: t.riskScore,
        severity: (t.riskLevel === 'Critical' ? 'Critical' : t.riskLevel === 'High' ? 'High' : t.riskLevel === 'Medium' ? 'Medium' : 'Low') as Alert['severity'],
        description: t.riskFactors?.[0] || 'Suspicious transaction pattern detected',
        time: `${t.date} ${t.time}`,
        read: false,
      }));
  } catch (err) {
    console.warn('Failed to fetch alerts:', err);
    return [];
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await axios.get(`${API_URL}/transactions/stats`);
    return response.data;
  } catch (err) {
    console.warn('Failed to fetch dashboard stats, using safe default:', err);
    return {
      totalTransactions: 0,
      genuine: 0,
      suspicious: 0,
      fraud: 0,
      fraudRate: 0,
      trends: {
        totalTransactions: 0,
        genuine: 0,
        suspicious: 0,
        fraud: 0,
        fraudRate: 0,
      }
    };
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const response = await axios.get(`${API_URL}/transactions/stats`);
    return {
      totalUsers: 0,
      totalTransactions: response.data.totalTransactions || 0,
      fraudCases: response.data.fraud || 0,
      suspiciousCases: response.data.suspicious || 0,
      fraudRate: response.data.fraudRate || 0,
      activeAlerts: (response.data.fraud || 0) + (response.data.suspicious || 0),
    };
  } catch (err) {
    console.warn('Failed to fetch admin stats:', err);
    return {
      totalUsers: 0,
      totalTransactions: 0,
      fraudCases: 0,
      suspiciousCases: 0,
      fraudRate: 0,
      activeAlerts: 0,
    };
  }
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
    let data: Record<string, unknown> | null = null;

    // 1. Try Node backend proxy endpoint
    try {
      const res = await fetch(`${API_URL}/ml/health`);
      if (res.ok) {
        data = (await res.json()) as Record<string, unknown>;
      }
    } catch (err) {
      console.warn('Backend ML health proxy unavailable:', err);
    }

    // 2. Try direct ML API URL
    if (!data || (data.status !== 'ok' && data.status !== 'healthy')) {
      try {
        const res = await fetch(`${ML_API_URL}/health`);
        if (res.ok) {
          data = (await res.json()) as Record<string, unknown>;
        }
      } catch (err) {
        console.warn('Direct ML API health endpoint unavailable:', err);
      }
    }

    // 3. Try direct IPv4 127.0.0.1
    if (!data || (data.status !== 'ok' && data.status !== 'healthy')) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/health`);
        if (res.ok) {
          data = (await res.json()) as Record<string, unknown>;
        }
      } catch (err) {
        console.warn('Direct IPv4 ML health endpoint unavailable:', err);
      }
    }

    if (data && (data.status === 'ok' || data.status === 'healthy' || data.model_loaded)) {
      return {
        status: 'ok',
        model_loaded: Boolean(data.model_loaded),
        model_version: (data.model_version as string) || 'v1.0.0',
        feature_count: (data.feature_count as number) || (data.features as number) || 20,
        algorithm: (data.algorithm as string) || (data.model as string) || 'XGBoost Classifier',
      };
    }

    throw new Error('Unhealthy ML Service');
  } catch (err) {
    console.warn('ML health check failed:', err);
    return {
      status: 'offline',
      model_loaded: false,
      model_version: 'Unavailable',
      feature_count: 0,
      algorithm: 'Unavailable',
    };
  }
}

export interface ModelInfoData {
  model_version?: string;
  algorithm?: string;
  target_column?: string;
  train_dataset_path?: string;
  test_dataset_path?: string;
  training_samples?: number;
  testing_samples?: number;
  training_genuine?: number;
  training_fraud?: number;
  testing_genuine?: number;
  testing_fraud?: number;
  scale_pos_weight?: number;
  feature_count?: number;
  feature_columns?: string[];
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    roc_auc?: number;
    confusion_matrix?: {
      true_negative?: number;
      false_positive?: number;
      false_negative?: number;
      true_positive?: number;
    };
  };
  model_loaded?: boolean;
}

export async function getModelInfo(): Promise<ModelInfoData | null> {
  try {
    let data: ModelInfoData | null = null;
    try {
      const res = await fetch(`${API_URL}/ml/model-info`);
      if (res.ok) data = (await res.json()) as ModelInfoData;
    } catch (err) {
      console.warn('Backend model-info proxy unavailable:', err);
    }

    if (!data) {
      const res = await fetch(`${ML_API_URL}/model-info`);
      if (res.ok) data = (await res.json()) as ModelInfoData;
    }

    return data;
  } catch (err) {
    console.warn('Failed to fetch model info:', err);
    return null;
  }
}

