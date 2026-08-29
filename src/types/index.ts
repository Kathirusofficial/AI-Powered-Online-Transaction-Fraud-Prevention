export type Prediction = 'Genuine' | 'Suspicious' | 'Fraud';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type TransactionType = 'Payment' | 'Transfer' | 'Withdrawal' | 'Deposit' | 'Purchase';
export type MerchantCategory = 'Retail' | 'Food & Dining' | 'Travel' | 'Entertainment' | 'Electronics' | 'Groceries' | 'Healthcare' | 'Gas' | 'Online' | 'Other';
export type DeviceType = 'Mobile' | 'Desktop' | 'Tablet' | 'Unknown';
export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type UserRole = 'Admin' | 'Analyst' | 'User';
export type AccountStatus = 'Active' | 'Suspended' | 'Pending';

export interface FeatureImportanceItem {
  feature: string;
  label: string;
  importance: number;
  value?: any;
}

export interface ModelExplanation {
  summary: string;
  evaluatedFactors: string[];
  topModelFeatures: FeatureImportanceItem[];
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: TransactionType;
  merchantCategory: MerchantCategory;
  merchantUrl?: string;
  location: string;
  date: string;
  time: string;
  riskScore: number;
  fraudProbability: number;
  prediction: Prediction;
  riskLevel: RiskLevel;
  status: 'Pending' | 'Reviewed' | 'Resolved' | 'Flagged' | 'Blocked';
  accountAge: number;
  previousTransactionAmount: number;
  transactionFrequency: number;
  previousFraudCount: number;
  distanceFromPrevious: number;
  deviceType: DeviceType;
  ipRiskScore: number;
  riskFactors: string[];
  timeline: { time: string; event: string; status: 'info' | 'warning' | 'danger' }[];
  modelVersion?: string;
}

export interface Alert {
  id: string;
  title: string;
  transactionId: string;
  riskScore: number;
  severity: AlertSeverity;
  description: string;
  time: string;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  transactions: number;
  joinedDate: string;
  avatar?: string;
}

export interface DashboardStats {
  totalTransactions: number;
  genuine: number;
  suspicious: number;
  fraud: number;
  fraudRate: number;
  trends: {
    totalTransactions: number;
    genuine: number;
    suspicious: number;
    fraud: number;
    fraudRate: number;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  fraudCases: number;
  suspiciousCases: number;
  fraudRate: number;
  activeAlerts: number;
}

export interface AnalyzeResult {
  riskLevel: RiskLevel;
  prediction: Prediction;
  fraudProbability: number;
  riskScore: number;
  riskFactors: string[];
  modelVersion?: string;
  explanation?: ModelExplanation;
}
