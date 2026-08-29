import { useState } from 'react';
import { Mail, Calendar, Shield, Save, User as UserIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || 'Sarah Chen');
  const [email, setEmail] = useState(user?.email || 'sarah.chen@shieldmail.com');
  const [editing, setEditing] = useState(false);

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const role = user?.role || 'Analyst';
  const joinDate = 'January 15, 2024';

  const handleSave = () => {
    setEditing(false);
    toast('Profile updated successfully', 'success');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">PROFILE</h1>
          <p className="text-text-secondary mt-1">Manage your personal information.</p>
        </div>

        {/* Profile Header */}
        <div className="card p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 text-center sm:text-left pt-2">
              <h2 className="text-2xl font-bold text-text-primary tracking-tight">{name}</h2>
              <p className="text-sm font-mono text-text-secondary mt-1">{email}</p>
              <div className="flex items-center gap-3 mt-4 justify-center sm:justify-start">
                <Badge variant="primary"><Shield className="w-3 h-3" /> {role.toUpperCase()}</Badge>
                <Badge variant="success">ACTIVE</Badge>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-text-secondary"><UserIcon className="w-4 h-4" /></div>
              <div><p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">ROLE</p><p className="text-sm font-medium text-text-primary mt-0.5">{role}</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-text-secondary"><Mail className="w-4 h-4" /></div>
              <div><p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">EMAIL</p><p className="text-sm font-medium text-text-primary truncate mt-0.5">{email}</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-text-secondary"><Calendar className="w-4 h-4" /></div>
              <div><p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">JOINED</p><p className="text-sm font-medium text-text-primary mt-0.5">{joinDate}</p></div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-8 pb-2 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Edit Details</h3>
            {!editing && <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>}
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <Input label="Full Name" name="name" value={name} onChange={e => setName(e.target.value)} disabled={!editing} />
            <Input label="Email" type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!editing} />
          </div>
          {editing && (
            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
              <Button variant="secondary" onClick={() => { setEditing(false); setName(user?.name || 'Sarah Chen'); setEmail(user?.email || 'sarah.chen@shieldmail.com'); }}>Cancel</Button>
              <Button onClick={handleSave}><Save className="w-4 h-4" /> Save Changes</Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
