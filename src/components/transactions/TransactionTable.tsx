import { Link } from 'react-router-dom';
import type { Transaction } from '@/types';
import { PredictionBadge } from '@/components/common/Badge';
import { formatCurrency } from '@/utils/helpers';
import { Eye } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  showUser?: boolean;
  showStatus?: boolean;
  loading?: boolean;
  emptyState?: React.ReactNode;
}

export default function TransactionTable({ transactions, showUser = false, showStatus = false, loading, emptyState }: TransactionTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return <>{emptyState || <p className="text-center text-text-secondary py-12">No transactions found</p>}</>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-text-secondary uppercase tracking-wider border-b border-border">
            <th className="px-4 py-4 font-semibold">Transaction ID</th>
            {showUser && <th className="px-4 py-4 font-semibold">User</th>}
            <th className="px-4 py-4 font-semibold">Amount</th>
            <th className="px-4 py-4 font-semibold">Type</th>
            <th className="px-4 py-4 font-semibold">Location</th>
            <th className="px-4 py-4 font-semibold">Risk Score</th>
            <th className="px-4 py-4 font-semibold">Prediction</th>
            <th className="px-4 py-4 font-semibold">Date</th>
            {showStatus && <th className="px-4 py-4 font-semibold">Status</th>}
            <th className="px-4 py-4 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {transactions.map(t => (
            <tr key={t.id} className="hover:bg-background/50 transition-colors group">
              <td className="px-4 py-4 font-mono text-text-primary text-xs">{t.id}</td>
              {showUser && <td className="px-4 py-4 text-text-primary font-medium">{t.userName}</td>}
              <td className="px-4 py-4 font-medium text-text-primary">{formatCurrency(t.amount)}</td>
              <td className="px-4 py-4 text-text-secondary">{t.type}</td>
              <td className="px-4 py-4 text-text-secondary">{t.location}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${t.riskScore >= 75 ? 'text-danger' : t.riskScore >= 50 ? 'text-warning' : 'text-success'}`}>
                    {t.riskScore}
                  </span>
                  <div className="w-16 h-1 bg-surface rounded-full overflow-hidden border border-border">
                    <div
                      className={`h-full rounded-full ${t.riskScore >= 75 ? 'bg-danger' : t.riskScore >= 50 ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${t.riskScore}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-4"><PredictionBadge prediction={t.prediction} /></td>
              <td className="px-4 py-4 text-text-secondary whitespace-nowrap text-xs">{t.date}</td>
              {showStatus && (
                <td className="px-4 py-4">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    t.status === 'Flagged' ? 'bg-danger/10 text-danger border border-danger/20' :
                    t.status === 'Reviewed' ? 'bg-primary/10 text-primary border border-primary/20' :
                    t.status === 'Resolved' ? 'bg-success/10 text-success border border-success/20' :
                    'bg-surface text-text-secondary border border-border'
                  }`}>{t.status}</span>
                </td>
              )}
              <td className="px-4 py-4 text-right">
                <Link to={`/transactions/${t.id}`} className="inline-flex items-center gap-1.5 text-primary hover:opacity-80 text-xs font-semibold uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5" /> View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
