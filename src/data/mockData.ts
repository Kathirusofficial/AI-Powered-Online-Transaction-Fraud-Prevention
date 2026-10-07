import type { Transaction, DashboardStats, User } from '@/types';

export interface ReportItem {
  id: string;
  title: string;
  description: string;
  type: string;
  generated: string;
  records: number;
}

export interface RiskDistributionItem {
  level: string;
  count: number;
  percentage: number;
  color: string;
}

export interface FraudDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface ActivityItem {
  date: string;
  total: number;
  fraud: number;
  suspicious: number;
}

export const mockTransactions: Transaction[] = [];
export const mockUsers: User[] = [];
export const reports: ReportItem[] = [
  { id: 'REP-001', title: 'Daily Transaction Summary', description: 'Overview of all transactions processed in the last 24 hours.', type: 'Daily', generated: 'Today, 06:00', records: 0 },
  { id: 'REP-002', title: 'Weekly Fraud Assessment', description: 'Comprehensive analysis of flagged and high-risk transactions.', type: 'Weekly', generated: 'Yesterday', records: 0 },
  { id: 'REP-003', title: 'Monthly Risk Trends', description: 'Aggregated patterns and risk score movements across categories.', type: 'Monthly', generated: '3 days ago', records: 0 },
  { id: 'REP-004', title: 'High-Risk Incident Log', description: 'Detailed log of all critical alerts and blocked payment attempts.', type: 'Incident', generated: '5 days ago', records: 0 },
];

export const mockDashboardStats: DashboardStats = {
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
    fraudRate: 0
  }
};

export const transactionActivity7Days: ActivityItem[] = [
  { date: 'Mon', total: 0, fraud: 0, suspicious: 0 },
  { date: 'Tue', total: 0, fraud: 0, suspicious: 0 },
  { date: 'Wed', total: 0, fraud: 0, suspicious: 0 },
  { date: 'Thu', total: 0, fraud: 0, suspicious: 0 },
  { date: 'Fri', total: 0, fraud: 0, suspicious: 0 },
  { date: 'Sat', total: 0, fraud: 0, suspicious: 0 },
  { date: 'Sun', total: 0, fraud: 0, suspicious: 0 },
];

export const fraudDistribution: FraudDistributionItem[] = [
  { name: 'Genuine', value: 100, color: '#10b981' },
  { name: 'Suspicious', value: 0, color: '#f59e0b' },
  { name: 'Fraud', value: 0, color: '#ef4444' },
];

export const riskDistribution: RiskDistributionItem[] = [
  { level: 'Low', count: 0, percentage: 0, color: '#10b981' },
  { level: 'Medium', count: 0, percentage: 0, color: '#f59e0b' },
  { level: 'High', count: 0, percentage: 0, color: '#ef4444' },
  { level: 'Critical', count: 0, percentage: 0, color: '#dc2626' },
];
