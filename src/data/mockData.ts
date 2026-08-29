import type { Transaction, Alert, User, DashboardStats, AdminStats } from '@/types';
import { getRiskLevel, getPrediction } from '@/utils/helpers';

const locations = ['New York, US', 'London, UK', 'Tokyo, JP', 'Berlin, DE', 'Sydney, AU', 'Toronto, CA', 'Singapore, SG', 'Dubai, AE', 'Paris, FR', 'Mumbai, IN', 'São Paulo, BR', 'Seoul, KR', 'Amsterdam, NL', 'Stockholm, SE', 'Mexico City, MX'];
const types = ['Payment', 'Transfer', 'Withdrawal', 'Deposit', 'Purchase'] as const;
const merchantCategories = ['Retail', 'Food & Dining', 'Travel', 'Entertainment', 'Electronics', 'Groceries', 'Healthcare', 'Gas', 'Online', 'Other'] as const;
const devices = ['Mobile', 'Desktop', 'Tablet', 'Unknown'] as const;
const userNames = ['Sarah Chen', 'Marcus Webb', 'Elena Vasquez', 'James Okafor', 'Priya Sharma', 'David Kim', 'Anna Mueller', 'Lucas Silva', 'Mei Lin', 'Omar Hassan', 'Sofia Rossi', 'Nathan Brooks', 'Yuki Tanaka', 'Klaus Weber', 'Aisha Khan', 'Pedro Costa', 'Hannah Schmidt', 'Ravi Patel', 'Leah Cohen', 'Diego Lopez'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateRiskFactors(amount: number, freq: number, distance: number, ipRisk: number, prevFraud: number, accountAge: number): string[] {
  const factors: string[] = [];
  if (amount > 3000) factors.push('Transaction amount is unusually high');
  if (freq > 15) factors.push('Transaction frequency is above normal');
  if (distance > 500) factors.push('Location differs from previous activity');
  if (ipRisk > 70) factors.push('Elevated IP risk score detected');
  if (prevFraud > 0) factors.push('Previous suspicious activity detected');
  if (accountAge < 30) factors.push('Account is relatively new');
  if (amount > 5000 && freq > 10) factors.push('High amount combined with unusual frequency');
  if (ipRisk > 80) factors.push('IP address linked to suspicious network');
  if (factors.length === 0) factors.push('Transaction matches normal behavioral patterns');
  return factors;
}

function generateTransactions(count: number): Transaction[] {
  return [];
}

export const mockTransactions: Transaction[] = [];

export const mockUsers: User[] = userNames.map((name, i) => {
  const roles: User['role'][] = i < 2 ? ['Admin'] : i < 6 ? ['Analyst'] : ['User'];
  const statuses: User['status'][] = i < 18 ? ['Active'] : i < 19 ? ['Suspended'] : ['Pending'];
  return {
    id: `U${String(i + 1).padStart(4, '0')}`,
    name,
    email: name.toLowerCase().replace(/[^a-z]/g, '.').replace(/\.+/g, '.') + '@shieldmail.com',
    role: roles[0],
    status: statuses[0],
    transactions: Math.floor(Math.abs(Math.sin(i + 1)) * 120) + 8,
    joinedDate: new Date(2024, (i * 3) % 12, ((i * 7) % 28) + 1).toISOString().split('T')[0],
  };
});

export const mockAlerts: Alert[] = mockTransactions
  .filter(t => t.prediction !== 'Genuine')
  .slice(0, 24)
  .map((t, i) => ({
    id: `ALT${String(5000 + i).padStart(5, '0')}`,
    title: t.prediction === 'Fraud' ? `Fraud Detected — ${t.id}` : `Suspicious Activity — ${t.id}`,
    transactionId: t.id,
    riskScore: t.riskScore,
    severity: (t.riskLevel === 'Critical' ? 'Critical' : t.riskLevel === 'High' ? 'High' : t.riskLevel === 'Medium' ? 'Medium' : 'Low') as Alert['severity'],
    description: t.riskFactors[0] || 'Suspicious transaction pattern detected',
    time: `${t.date} ${t.time}`,
    read: i > 8,
  }));

export const mockDashboardStats: DashboardStats = {
  totalTransactions: 12486,
  genuine: 11742,
  suspicious: 531,
  fraud: 213,
  fraudRate: 1.71,
  trends: { totalTransactions: 3.2, genuine: 2.8, suspicious: -5.1, fraud: 12.4, fraudRate: 0.3 },
};

export const mockAdminStats: AdminStats = {
  totalUsers: 4862,
  totalTransactions: 12486,
  fraudCases: 213,
  suspiciousCases: 531,
  fraudRate: 1.71,
  activeAlerts: 16,
};

export const transactionActivity7Days = [
  { date: 'Aug 10', total: 420, fraud: 8 },
  { date: 'Aug 11', total: 380, fraud: 6 },
  { date: 'Aug 12', total: 510, fraud: 12 },
  { date: 'Aug 13', total: 460, fraud: 9 },
  { date: 'Aug 14', total: 590, fraud: 15 },
  { date: 'Aug 15', total: 540, fraud: 11 },
  { date: 'Aug 16', total: 610, fraud: 14 },
];

export const transactionActivity30Days = Array.from({ length: 30 }, (_, i) => {
  const base = 400 + Math.sin(i / 3) * 120 + i * 5;
  return { date: `Day ${i + 1}`, total: Math.round(base + Math.random() * 80), fraud: Math.round(Math.max(2, base * 0.025 + Math.random() * 8)) };
});

export const transactionActivity90Days = Array.from({ length: 12 }, (_, i) => {
  const base = 11000 + Math.sin(i / 2) * 2000 + i * 200;
  return { date: `Wk ${i + 1}`, total: Math.round(base), fraud: Math.round(Math.max(20, base * 0.022)) };
});

export const fraudDistribution = [
  { name: 'Genuine', value: 11742, color: '#22c55e' },
  { name: 'Suspicious', value: 531, color: '#eab308' },
  { name: 'Fraud', value: 213, color: '#e11d48' },
];

export const riskDistribution = [
  { level: 'Low', count: 9420, percentage: 75.4, color: '#22c55e' },
  { level: 'Medium', count: 2310, percentage: 18.5, color: '#eab308' },
  { level: 'High', count: 543, percentage: 4.3, color: '#ef4444' },
  { level: 'Critical', count: 213, percentage: 1.7, color: '#e11d48' },
];

export const fraudTrend = Array.from({ length: 12 }, (_, i) => {
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i];
  return { month, fraud: Math.round(120 + Math.sin(i / 2) * 60 + i * 8), suspicious: Math.round(300 + Math.cos(i / 3) * 100 + i * 12) };
});

export const transactionVolume = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  volume: Math.round(900 + Math.sin(i / 2) * 200 + i * 30),
}));

export const fraudByType = [
  { type: 'Payment', fraud: 68, genuine: 3200 },
  { type: 'Transfer', fraud: 54, genuine: 2800 },
  { type: 'Withdrawal', fraud: 41, genuine: 2100 },
  { type: 'Deposit', fraud: 22, genuine: 2500 },
  { type: 'Purchase', fraud: 28, genuine: 1142 },
];

export const fraudByLocation = [
  { location: 'New York, US', count: 42 },
  { location: 'London, UK', count: 35 },
  { location: 'Tokyo, JP', count: 28 },
  { location: 'Singapore, SG', count: 24 },
  { location: 'Berlin, DE', count: 19 },
  { location: 'Dubai, AE', count: 16 },
  { location: 'Mumbai, IN', count: 14 },
  { location: 'São Paulo, BR', count: 10 },
];

export const monthlyComparison = [
  { month: 'Jan', genuine: 920, suspicious: 38, fraud: 12 },
  { month: 'Feb', genuine: 980, suspicious: 42, fraud: 15 },
  { month: 'Mar', genuine: 1050, suspicious: 45, fraud: 18 },
  { month: 'Apr', genuine: 1100, suspicious: 48, fraud: 16 },
  { month: 'May', genuine: 1180, suspicious: 52, fraud: 20 },
  { month: 'Jun', genuine: 1220, suspicious: 55, fraud: 22 },
  { month: 'Jul', genuine: 1280, suspicious: 58, fraud: 19 },
  { month: 'Aug', genuine: 1340, suspicious: 62, fraud: 24 },
];

export const reports = [
  { id: 'RPT001', title: 'Daily Fraud Report', description: 'Summary of fraud detected in the last 24 hours', type: 'Daily', generated: '2026-08-16', records: 14 },
  { id: 'RPT002', title: 'Weekly Transaction Report', description: 'Weekly overview of all processed transactions', type: 'Weekly', generated: '2026-08-15', records: 4280 },
  { id: 'RPT003', title: 'Monthly Risk Report', description: 'Monthly breakdown of risk distribution and trends', type: 'Monthly', generated: '2026-08-01', records: 12486 },
  { id: 'RPT004', title: 'Suspicious Activity Report', description: 'Detailed analysis of suspicious transactions', type: 'Special', generated: '2026-08-14', records: 531 },
];
