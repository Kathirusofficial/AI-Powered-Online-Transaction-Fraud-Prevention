import { useState } from 'react';
import { FileText, Download, Calendar, FileBarChart } from 'lucide-react';
import { AdminLayout } from '@/components/layout/DashboardLayout';
import Button from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/hooks/useToast';
import { reports, mockTransactions } from '@/data/mockData';
import type { Transaction } from '@/types';

function exportCSV(transactions: Transaction[], filename: string) {
  const headers = ['Transaction ID', 'User', 'Amount', 'Type', 'Merchant Category', 'Location', 'Date', 'Time', 'Risk Score', 'Fraud Probability', 'Prediction', 'Risk Level', 'Status'];
  const rows = transactions.map(t => [t.id, t.userName, t.amount, t.type, t.merchantCategory, t.location, t.date, t.time, t.riskScore, t.fraudProbability, t.prediction, t.riskLevel, t.status]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
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

  const handleExport = (reportId: string, reportType: string) => {
    setExporting(reportId);
    setTimeout(() => {
      let data: Transaction[] = [];
      if (reportType === 'Daily') data = mockTransactions.slice(0, 14);
      else if (reportType === 'Weekly') data = mockTransactions.slice(0, 50);
      else if (reportType === 'Monthly') data = mockTransactions;
      else data = mockTransactions.filter(t => t.prediction !== 'Genuine');
      exportCSV(data, `${reportId}_${new Date().toISOString().split('T')[0]}.csv`);
      setExporting(null);
      toast(`${reportType} report exported successfully`, 'success');
    }, 800);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400"><FileBarChart className="w-5 h-5" /></div>
          <div>
            <h2 className="text-xl font-semibold text-ink-100">Fraud Detection Reports</h2>
            <p className="text-sm text-ink-400">Generate and export reports from transaction data</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {reports.map(r => (
            <div key={r.id} className="card card-hover p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-ink-800 flex items-center justify-center text-accent-400"><FileText className="w-5 h-5" /></div>
                <Badge variant={r.type === 'Daily' ? 'info' : r.type === 'Weekly' ? 'success' : r.type === 'Monthly' ? 'warning' : 'critical'}>{r.type}</Badge>
              </div>
              <h3 className="text-base font-semibold text-ink-100">{r.title}</h3>
              <p className="text-sm text-ink-400 mt-1">{r.description}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-ink-400">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {r.generated}</span>
                <span>{r.records.toLocaleString()} records</span>
              </div>
              <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => handleExport(r.id, r.type)} disabled={exporting === r.id}>
                {exporting === r.id ? (
                  <><span className="w-4 h-4 border-2 border-ink-300 border-t-transparent rounded-full animate-spin" /> Exporting...</>
                ) : (
                  <><Download className="w-4 h-4" /> Export CSV</>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-100 mb-2">About CSV Export</h3>
          <p className="text-sm text-ink-400">Reports are generated directly from current transaction data and downloaded as CSV files. Each export includes transaction IDs, user information, amounts, risk scores, and prediction results. In the next development stage, these will be replaced with server-generated reports.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
