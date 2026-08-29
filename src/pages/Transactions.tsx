import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import TransactionTable from '@/components/transactions/TransactionTable';
import Pagination from '@/components/common/Pagination';
import { LoadingState, NoResultsState } from '@/components/common/States';
import { getTransactions } from '@/services/fraudService';
import type { Transaction, Prediction } from '@/types';

const PER_PAGE = 10;
const predictionOptions = [
  { value: 'all', label: 'All Predictions' },
  { value: 'Genuine', label: 'Genuine' },
  { value: 'Suspicious', label: 'Suspicious' },
  { value: 'Fraud', label: 'Fraud' },
];
const riskOptions = [
  { value: 'all', label: 'All Risk Levels' },
  { value: 'Low', label: 'Low Risk' },
  { value: 'Medium', label: 'Medium Risk' },
  { value: 'High', label: 'High Risk' },
  { value: 'Critical', label: 'Critical Risk' },
];
const sortOptions = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'amount-desc', label: 'Amount: High to Low' },
  { value: 'amount-asc', label: 'Amount: Low to High' },
  { value: 'risk-desc', label: 'Risk: High to Low' },
  { value: 'risk-asc', label: 'Risk: Low to High' },
];

export default function Transactions() {
  const [all, setAll] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [prediction, setPrediction] = useState('all');
  const [risk, setRisk] = useState('all');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    getTransactions().then(t => { setAll(t); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let result = [...all];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.id.toLowerCase().includes(q) || t.location.toLowerCase().includes(q) || t.type.toLowerCase().includes(q));
    }
    if (prediction !== 'all') result = result.filter(t => t.prediction === (prediction as Prediction));
    if (risk !== 'all') result = result.filter(t => t.riskLevel === risk);
    switch (sort) {
      case 'date-asc': result.sort((a, b) => a.date.localeCompare(b.date)); break;
      case 'amount-desc': result.sort((a, b) => b.amount - a.amount); break;
      case 'amount-asc': result.sort((a, b) => a.amount - b.amount); break;
      case 'risk-desc': result.sort((a, b) => b.riskScore - a.riskScore); break;
      case 'risk-asc': result.sort((a, b) => a.riskScore - b.riskScore); break;
      default: result.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    }
    return result;
  }, [all, search, prediction, risk, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [search, prediction, risk, sort]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">TRANSACTIONS</h1>
            <p className="text-text-secondary mt-1">Search, filter, and review all processed transactions.</p>
          </div>
          {all.length > 0 && (
            <Link to="/detect">
              <Button><Plus className="w-4 h-4" /> Create Transaction</Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="card"><LoadingState message="Loading transactions..." /></div>
        ) : all.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6 text-text-secondary">
              <Inbox className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">No transactions yet</h2>
            <p className="text-text-secondary mt-2 max-w-sm">
              Start by creating your first transaction to see the fraud analysis here.
            </p>
            <Link to="/detect" className="mt-8">
              <Button size="lg"><Plus className="w-4 h-4" /> Create Transaction</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="card p-6 border-l-4 border-l-primary">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <Input label="Search" name="search" placeholder="ID, location, type..." icon={<Search className="w-4 h-4" />} value={search} onChange={e => setSearch(e.target.value)} />
                <Select label="Prediction" options={predictionOptions} value={prediction} onChange={e => setPrediction(e.target.value)} />
                <Select label="Risk Level" options={riskOptions} value={risk} onChange={e => setRisk(e.target.value)} />
                <Select label="Sort By" options={sortOptions} value={sort} onChange={e => setSort(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-primary" />
                Showing {filtered.length} of {all.length} transactions
              </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
              {paged.length === 0 ? <NoResultsState /> : (
                <>
                  <TransactionTable transactions={paged} />
                  <div className="p-4 border-t border-border bg-background/50">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
