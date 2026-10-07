import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, FileBarChart } from 'lucide-react';
import { AdminLayout } from '@/components/layout/DashboardLayout';
import Button from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/hooks/useToast';
import { reports as staticReports } from '@/data/mockData';
import { getTransactions } from '@/services/fraudService';
import type { Transaction } from '@/types';

function escapeCSVCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function exportCSV(transactions: Transaction[], filename: string) {
  const headers = ['Transaction ID', 'User', 'Amount', 'Type', 'Merchant Category', 'Location', 'Date', 'Time', 'Risk Score', 'Fraud Probability', 'Prediction', 'Risk Level', 'Status'];
  const rows = transactions.map(t => [
    t.id,
    t.userName || 'N/A',
    t.amount,
    t.type,
    t.merchantCategory,
    t.location,
    t.date,
    t.time,
    t.riskScore,
    t.fraudProbability,
    t.prediction,
    t.riskLevel,
    t.status
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(escapeCSVCell).join(','))
    .join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Fetch all real transactions for reporting metrics
    getTransactions(1, 10000).then(setAllTransactions).catch(err => console.warn('Error pre-fetching report data:', err));
  }, []);

  const filterTransactionsForReport = (reportType: string, txns: Transaction[]): Transaction[] => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (reportType === 'Daily') {
      return txns.filter(t => t.date === todayStr || (t.date && new Date(t.date).getTime() >= now.getTime() - 86400000));
    } else if (reportType === 'Weekly') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
      return txns.filter(t => t.date && new Date(t.date) >= sevenDaysAgo);
    } else if (reportType === 'Monthly') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      return txns.filter(t => !t.date || new Date(t.date) >= thirtyDaysAgo);
    } else if (reportType === 'Incident') {
      return txns.filter(t => t.prediction !== 'Genuine');
    }
    return txns;
  };

  const handleExport = async (reportId: string, reportType: string) => {
    setExporting(reportId);
    try {
      const txns = await getTransactions(1, 10000);
      const filteredData = filterTransactionsForReport(reportType, txns);

      if (filteredData.length === 0) {
        toast(`No transactions found matching ${reportType} report criteria`, 'warning');
        return;
      }

      exportCSV(filteredData, `${reportId}_${new Date().toISOString().split('T')[0]}.csv`);
      toast(`${reportType} report (${filteredData.length} records) exported successfully`, 'success');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to export report CSV';
      toast(msg, 'error');
    } finally {
      setExporting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400"><FileBarChart className="w-5 h-5" /></div>
          <div>
            <h2 className="text-xl font-semibold text-ink-100">Fraud Detection Reports</h2>
            <p className="text-sm text-ink-400">Generate and export reports directly from real MongoDB transaction data</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {staticReports.map(r => {
            const matchingCount = filterTransactionsForReport(r.type, allTransactions).length;
            return (
              <div key={r.id} className="card card-hover p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-lg bg-ink-800 flex items-center justify-center text-accent-400"><FileText className="w-5 h-5" /></div>
                  <Badge variant={r.type === 'Daily' ? 'info' : r.type === 'Weekly' ? 'success' : r.type === 'Monthly' ? 'warning' : 'critical'}>{r.type}</Badge>
                </div>
                <h3 className="text-base font-semibold text-ink-100">{r.title}</h3>
                <p className="text-sm text-ink-400 mt-1">{r.description}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-ink-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {r.generated}</span>
                  <span className="font-semibold text-ink-200">{matchingCount.toLocaleString()} real records</span>
                </div>
                <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => handleExport(r.id, r.type)} disabled={exporting === r.id}>
                  {exporting === r.id ? (
                    <><span className="w-4 h-4 border-2 border-ink-300 border-t-transparent rounded-full animate-spin" /> Fetching & Exporting...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Export Real CSV</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-100 mb-2">About Real CSV Export</h3>
          <p className="text-sm text-ink-400">Reports are fetched directly from MongoDB transaction records and formatted with full CSV cell escaping (quotes, commas, newlines). Includes transaction IDs, user names, monetary amounts, geodesic distance metrics, risk scores, and AI predictions.</p>
        </div>
      </div>
    </AdminLayout>
  );
}

