import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Inbox, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import TransactionTable from '@/components/transactions/TransactionTable';
import Pagination from '@/components/common/Pagination';
import { LoadingState, NoResultsState } from '@/components/common/States';
import { getPaginatedTransactions } from '@/services/fraudService';
import type { Transaction } from '@/types';

const PER_PAGE = 10;

const filterOptions = [
  { value: 'all', label: 'All Predictions' },
  { value: 'genuine', label: 'Genuine Only' },
  { value: 'suspicious', label: 'Suspicious Only' },
  { value: 'fraud', label: 'Fraud Only' },
];

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const filterParam = searchParams.get('filter') || 'all';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParam);
  const [filter, setFilter] = useState(filterParam);
  const [page, setPage] = useState(1);
  const [hasAnyTransactions, setHasAnyTransactions] = useState(true);

  // Sync state when URL searchParams change
  useEffect(() => {
    const s = searchParams.get('search') || '';
    const f = searchParams.get('filter') || 'all';
    setSearch(s);
    setFilter(f);
    setPage(1);
  }, [searchParams]);

  const fetchTxns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPaginatedTransactions(page, PER_PAGE, search, filter);
      setTransactions(data.transactions);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (page === 1 && !search && filter === 'all' && data.total === 0) {
         setHasAnyTransactions(false);
      } else {
         setHasAnyTransactions(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    fetchTxns();
  }, [fetchTxns]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    const newParams: Record<string, string> = {};
    if (val) newParams.search = val;
    if (filter && filter !== 'all') newParams.filter = filter;
    setSearchParams(newParams);
  };

  const handleFilterChange = (val: string) => {
    setFilter(val);
    setPage(1);
    const newParams: Record<string, string> = {};
    if (search) newParams.search = search;
    if (val && val !== 'all') newParams.filter = val;
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearch('');
    setFilter('all');
    setPage(1);
    setSearchParams({});
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">TRANSACTIONS</h1>
            <p className="text-text-secondary mt-1">Search, filter, and review all processed transactions.</p>
          </div>
          {hasAnyTransactions && (
            <Link to="/detect">
              <Button><Plus className="w-4 h-4" /> Create Transaction</Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="card"><LoadingState message="Loading transactions..." /></div>
        ) : !hasAnyTransactions ? (
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
              <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <Input label="Search" name="search" placeholder="Search by Transaction ID or Location..." icon={<Search className="w-4 h-4" />} value={search} onChange={handleSearchChange} />
                </div>
                <div>
                  <Select label="Filter Prediction" options={filterOptions} value={filter} onChange={e => handleFilterChange(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  Showing {transactions.length} of {total} transactions {filter !== 'all' && <span className="text-primary font-bold">({filter.toUpperCase()})</span>}
                </div>
                {(search || filter !== 'all') && (
                  <button onClick={clearFilters} className="text-text-secondary hover:text-danger flex items-center gap-1 normal-case text-xs transition-colors">
                    <X className="w-3.5 h-3.5" /> Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
              {transactions.length === 0 ? <NoResultsState /> : (
                <>
                  <TransactionTable transactions={transactions} />
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-border bg-background/50">
                      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
