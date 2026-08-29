import { useState } from 'react';
import { User, Lock, Bell, Palette, Shield, Moon, Sun, Monitor, KeyRound, LogIn } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useToast } from '@/hooks/useToast';
import { classNames } from '@/utils/helpers';

type Theme = 'dark' | 'light' | 'system';

export default function Settings() {
  const { toast } = useToast();
  const [theme, setTheme] = useState<Theme>('dark');
  const [notifications, setNotifications] = useState({ fraudAlerts: true, email: true, security: true });
  const [twoFA, setTwoFA] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const toggle = (key: keyof typeof notifications) => setNotifications(n => ({ ...n, [key]: !n[key] }));

  const handlePwdSave = () => {
    if (!currentPwd || !newPwd || !confirmPwd) { toast('Please fill all password fields', 'error'); return; }
    if (newPwd !== confirmPwd) { toast('Passwords do not match', 'error'); return; }
    if (newPwd.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    toast('Password updated successfully', 'success');
  };

  const themes: { value: Theme; label: string; icon: typeof Moon }[] = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">SETTINGS</h1>
          <p className="text-text-secondary mt-1">Manage your account preferences and security.</p>
        </div>

        {/* Account */}
        <div className="card p-8">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 mb-6 pb-2 border-b border-border"><User className="w-4 h-4 text-primary" /> Account</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <Input label="Full Name" defaultValue="Sarah Chen" />
            <Input label="Email" type="email" defaultValue="sarah.chen@shieldmail.com" />
          </div>
          <div className="flex justify-end mt-6"><Button size="sm" onClick={() => toast('Profile settings saved', 'success')}>Save Changes</Button></div>
        </div>

        {/* Password */}
        <div className="card p-8">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 mb-6 pb-2 border-b border-border"><Lock className="w-4 h-4 text-primary" /> Password</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            <Input label="Current Password" type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" />
            <Input label="New Password" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••••••" />
            <Input label="Confirm Password" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="flex justify-end mt-6"><Button size="sm" onClick={handlePwdSave}>Update Password</Button></div>
        </div>

        {/* Notifications */}
        <div className="card p-8">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 mb-6 pb-2 border-b border-border"><Bell className="w-4 h-4 text-primary" /> Notifications</h3>
          <div className="space-y-6">
            {([
              { key: 'fraudAlerts' as const, label: 'Fraud Alerts', desc: 'Get notified when fraud is detected' },
              { key: 'email' as const, label: 'Email Notifications', desc: 'Receive email updates on activity' },
              { key: 'security' as const, label: 'Security Alerts', desc: 'Important security notifications' },
            ]).map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-text-primary">{item.label}</p><p className="text-xs text-text-secondary mt-0.5">{item.desc}</p></div>
                <button onClick={() => toggle(item.key)} className={classNames('relative w-11 h-6 rounded-full transition-colors', notifications[item.key] ? 'bg-primary' : 'bg-surface border border-border')}>
                  <span className={classNames('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform', notifications[item.key] ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-8">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 mb-6 pb-2 border-b border-border"><Palette className="w-4 h-4 text-primary" /> Appearance</h3>
          <div className="grid grid-cols-3 gap-4">
            {themes.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.value} onClick={() => { setTheme(t.value); toast(`Theme set to ${t.label}`, 'success'); }}
                  className={classNames('flex flex-col items-center gap-3 p-6 rounded-lg border transition-colors', theme === t.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-text-secondary hover:text-text-primary')}>
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium uppercase tracking-wider">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security */}
        <div className="card p-8">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 mb-6 pb-2 border-b border-border"><Shield className="w-4 h-4 text-primary" /> Security</h3>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-text-secondary mt-0.5" />
              <div><p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p><p className="text-xs text-text-secondary mt-0.5">Add an extra layer of security to your account</p></div>
            </div>
            <button onClick={() => { setTwoFA(!twoFA); toast(twoFA ? '2FA disabled' : '2FA enabled', twoFA ? 'warning' : 'success'); }} className={classNames('relative w-11 h-6 rounded-full transition-colors', twoFA ? 'bg-primary' : 'bg-surface border border-border')}>
              <span className={classNames('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform', twoFA ? 'translate-x-5' : 'translate-x-0.5')} />
            </button>
          </div>
          <div className="border-t border-border pt-6">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2"><LogIn className="w-4 h-4" /> Login Activity</p>
            <div className="space-y-3">
              {[
                { device: 'Chrome on macOS', location: 'New York, US', time: 'Active now', current: true },
                { device: 'Safari on iPhone', location: 'New York, US', time: '2 hours ago', current: false },
                { device: 'Firefox on Windows', location: 'Boston, US', time: '3 days ago', current: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/50">
                  <div><p className="text-sm font-medium text-text-primary">{s.device}</p><p className="text-xs text-text-secondary mt-0.5">{s.location}</p></div>
                  <div className="text-right"><p className="text-xs font-mono text-text-secondary">{s.time}</p>{s.current && <span className="text-xs font-semibold text-success mt-1 block">Current session</span>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
