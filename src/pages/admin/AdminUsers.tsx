import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Eye, UserCheck, UserX } from 'lucide-react';
import { AdminLayout } from '@/components/layout/DashboardLayout';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { LoadingState, ErrorState } from '@/components/common/States';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { getUsers, updateUserStatus } from '@/services/fraudService';
import type { User, AccountStatus } from '@/types';

const PER_PAGE = 10;
const roleOptions = [{ value: 'all', label: 'All Roles' }, { value: 'Admin', label: 'Admin' }, { value: 'Analyst', label: 'Analyst' }, { value: 'User', label: 'User' }];
const statusOptions = [{ value: 'all', label: 'All Statuses' }, { value: 'Active', label: 'Active' }, { value: 'Suspended', label: 'Suspended' }, { value: 'Pending', label: 'Pending' }];

export default function AdminUsers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [viewUser, setViewUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg || 'Failed to load users from backend';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    let result = [...users];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (role !== 'all') result = result.filter(u => u.role === role);
    if (status !== 'all') result = result.filter(u => u.status === status);
    return result;
  }, [users, search, role, status]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleStatus = async (targetUser: User) => {
    if (currentUser?.id === targetUser.id && targetUser.status === 'Active') {
      toast('An admin cannot suspend their own account', 'error');
      return;
    }

    const nextStatus: AccountStatus = targetUser.status === 'Active' ? 'Suspended' : 'Active';
    setUpdatingId(targetUser.id);
    try {
      const updated = await updateUserStatus(targetUser.id, nextStatus);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? updated : u));
      toast(`User ${updated.name} status updated to ${updated.status}`, updated.status === 'Active' ? 'success' : 'warning');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg || 'Failed to update user status';
      toast(msg, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="card p-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Input name="search" placeholder="Search by name or email..." icon={<Search className="w-4 h-4" />} value={search} onChange={e => setSearch(e.target.value)} />
            <Select options={roleOptions} value={role} onChange={e => setRole(e.target.value)} />
            <Select options={statusOptions} value={status} onChange={e => setStatus(e.target.value)} />
          </div>
          <p className="text-xs text-ink-400 mt-3">Showing {filtered.length} of {users.length} users</p>
        </div>

        <div className="card p-5">
          {loading ? (
            <LoadingState message="Loading users from MongoDB..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchUsers} />
          ) : paged.length === 0 ? (
            <p className="text-center text-ink-400 py-12">No users found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink-400 border-b border-ink-700">
                      {['Name', 'Email', 'Role', 'Transactions', 'Status', 'Joined', 'Actions'].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-700/50">
                    {paged.map(u => {
                      const isSelf = currentUser?.id === u.id;
                      const isUpdating = updatingId === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-ink-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-ink-950 text-xs font-bold shrink-0">
                                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <span className="text-ink-100 font-medium">
                                {u.name} {isSelf && <span className="text-[10px] text-accent-400 ml-1 font-mono">(You)</span>}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-ink-300">{u.email}</td>
                          <td className="px-4 py-3"><Badge variant={u.role === 'Admin' ? 'critical' : u.role === 'Analyst' ? 'info' : 'default'}>{u.role}</Badge></td>
                          <td className="px-4 py-3 text-ink-200">{u.transactions}</td>
                          <td className="px-4 py-3"><Badge variant={u.status === 'Active' ? 'success' : u.status === 'Suspended' ? 'danger' : 'warning'}>{u.status}</Badge></td>
                          <td className="px-4 py-3 text-ink-300 whitespace-nowrap">{u.joinedDate}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setViewUser(u)} className="p-1.5 rounded-md text-accent-400 hover:bg-ink-800" title="View"><Eye className="w-4 h-4" /></button>
                              <button
                                onClick={() => toggleStatus(u)}
                                disabled={isUpdating || (isSelf && u.status === 'Active')}
                                className={`p-1.5 rounded-md hover:bg-ink-800 disabled:opacity-40 ${u.status === 'Active' ? 'text-danger-500' : 'text-success-500'}`}
                                title={isSelf && u.status === 'Active' ? 'Cannot suspend own account' : u.status === 'Active' ? 'Suspend user' : 'Activate user'}
                              >
                                {u.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="User Details" size="md">
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-ink-950 text-xl font-bold">
                {viewUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-lg font-semibold text-ink-100">{viewUser.name}</p>
                <p className="text-sm text-ink-400">{viewUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'User ID', value: viewUser.id },
                { label: 'Role', value: viewUser.role },
                { label: 'Status', value: viewUser.status },
                { label: 'Transactions', value: String(viewUser.transactions) },
                { label: 'Joined Date', value: viewUser.joinedDate },
              ].map(f => (
                <div key={f.label} className="bg-ink-850 rounded-lg p-3">
                  <p className="text-xs text-ink-400">{f.label}</p>
                  <p className="text-sm text-ink-100 font-medium mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

