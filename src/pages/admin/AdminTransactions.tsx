import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, FileSearch, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/DashboardLayout';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { PredictionBadge } from '@/components/common/Badge';
import { LoadingState, NoResultsState } from '@/components/common/States';
import { getTransactions } from '@/services/fraudService';
import { useToast } from '@/hooks/useToast';
import type { Transaction } from '@/types';
import { formatCurrency } from '@/utils/helpers';

const PER_PAGE = 10;
const predictionOptions = [{ value: 'all', label: 'All Predictions' }, { value: 'Genuine', label: 'Genuine' }, { value: 'Suspicious', label: 'Suspicious' }, { value: 'Fraud', label: 'Fraud' }];
const sortOptions = [{ value: 'date-desc', label: 'Newest First' }, { value: 'date-asc', label: 'Oldest First' }, { value: 'amount-desc', label: 'Amount: High to Low' }, { value: 'risk-desc', label: 'Risk: High to Low' }];

export default function AdminTransactions() {
  const { toast } = useToast();
  const [all, setAll] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [prediction, setPrediction] = useState('all');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  useEffect(() => { getTransactions().then(t => { setAll(t); setLoading(false); }); }, []);

  const filtered = useMemo(() => {
    let result = [...all];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.id.toLowerCase().includes(q) || t.userName.toLowerCase().includes(q) || t.location.toLowerCase().includes(q));
    }
    if (prediction !== 'all') result = result.filter(t => t.prediction === prediction);
    switch (sort) {
      case 'date-asc': result.sort((a, b) => a.date.localeCompare(b.date)); break;
      case 'amount-desc': result.sort((a, b) => b.amount - a.amount); break;
      case 'risk-desc': result.sort((a, b) => b.riskScore - a.riskScore); break;
      default: result.sort((a, b) => b.date.localeCompare(a.date));
    }
    return result;
  }, [all, search, prediction, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setAll(a => a.filter(t => t.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast('Transaction deleted', 'success');
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="card p-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Input name="search" placeholder="Search by ID, user, location..." icon={<Search className="w-4 h-4" />} value={search} onChange={e => setSearch(e.target.value)} />
            <Select options={predictionOptions} value={prediction} onChange={e => setPrediction(e.target.value)} />
            <Select options={sortOptions} value={sort} onChange={e => setSort(e.target.value)} />
          </div>
          <p className="text-xs text-ink-400 mt-3">Showing {filtered.length} of {all.length} transactions</p>
        </div>

        <div className="card p-5">
          {loading ? <LoadingState message="Loading transactions..." /> : (
            paged.length === 0 ? <NoResultsState /> : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-ink-400 border-b border-ink-700">
                        {['Transaction ID', 'User', 'Amount', 'Type', 'Location', 'Risk Score', 'Prediction', 'Date', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-700/50">
                      {paged.map(t => (
                        <tr key={t.id} className="hover:bg-ink-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-ink-200">{t.id}</td>
                          <td className="px-4 py-3 text-ink-200">{t.userName}</td>
                          <td className="px-4 py-3 font-medium text-ink-100">{formatCurrency(t.amount)}</td>
                          <td className="px-4 py-3 text-ink-300">{t.type}</td>
                          <td className="px-4 py-3 text-ink-300">{t.location}</td>
                          <td className="px-4 py-3"><span className={t.riskScore >= 60 ? 'text-critical-400' : t.riskScore >= 30 ? 'text-warning-500' : 'text-success-500'}>{t.riskScore}</span></td>
                          <td className="px-4 py-3"><PredictionBadge prediction={t.prediction} /></td>
                          <td className="px-4 py-3 text-ink-300 whitespace-nowrap">{t.date}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-md ${t.status === 'Flagged' ? 'bg-critical-500/10 text-critical-400' : t.status === 'Reviewed' ? 'bg-accent-500/10 text-accent-400' : t.status === 'Resolved' ? 'bg-success-500/10 text-success-500' : 'bg-ink-800 text-ink-300'}`}>{t.status}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Link to={`/transactions/${t.id}`} className="p-1.5 rounded-md text-accent-400 hover:bg-ink-800" title="View"><Eye className="w-4 h-4" /></Link>
                              <button onClick={() => toast(`Transaction ${t.id} marked for review`, 'info')} className="p-1.5 rounded-md text-warning-500 hover:bg-ink-800" title="Review"><FileSearch className="w-4 h-4" /></button>
                              <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded-md text-danger-500 hover:bg-ink-800" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )
          )}
        </div>
      </div>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Transaction" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}>
        <p className="text-sm text-ink-300">Are you sure you want to delete transaction <span className="font-mono text-ink-100">{deleteTarget?.id}</span>? This action cannot be undone.</p>
      </Modal>
    </AdminLayout>
  );
}
