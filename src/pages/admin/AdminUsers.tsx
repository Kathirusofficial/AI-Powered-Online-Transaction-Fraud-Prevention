import { useState, useMemo } from 'react';
import { Search, Eye, UserCheck, UserX } from 'lucide-react';
import { AdminLayout } from '@/components/layout/DashboardLayout';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/hooks/useToast';
import { mockUsers } from '@/data/mockData';
import type { User } from '@/types';

const PER_PAGE = 10;
const roleOptions = [{ value: 'all', label: 'All Roles' }, { value: 'Admin', label: 'Admin' }, { value: 'Analyst', label: 'Analyst' }, { value: 'User', label: 'User' }];
const statusOptions = [{ value: 'all', label: 'All Statuses' }, { value: 'Active', label: 'Active' }, { value: 'Suspended', label: 'Suspended' }, { value: 'Pending', label: 'Pending' }];

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [viewUser, setViewUser] = useState<User | null>(null);

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

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleStatus = (id: string) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u));
    const u = users.find(x => x.id === id);
    toast(`${u?.name} ${u?.status === 'Active' ? 'suspended' : 'activated'}`, u?.status === 'Active' ? 'warning' : 'success');
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
          {paged.length === 0 ? (
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
                    {paged.map(u => (
                      <tr key={u.id} className="hover:bg-ink-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-ink-950 text-xs font-bold shrink-0">
                              {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="text-ink-100">{u.name}</span>
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
                            <button onClick={() => toggleStatus(u.id)} className={`p-1.5 rounded-md hover:bg-ink-800 ${u.status === 'Active' ? 'text-danger-500' : 'text-success-500'}`} title={u.status === 'Active' ? 'Suspend' : 'Activate'}>
                              {u.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
