import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Filter, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/common/Badge';
import { LoadingState, EmptyState } from '@/components/common/States';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import { getAlerts } from '@/services/fraudService';
import { useToast } from '@/hooks/useToast';
import type { Alert, AlertSeverity } from '@/types';
import { classNames } from '@/utils/helpers';

// Map severities to our new color palette (Primary, Success, Warning, Danger)
const severityColors: Record<AlertSeverity, { dot: string; text: string; bg: string }> = {
  Critical: { dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10 border border-danger/20' },
  High: { dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10 border border-danger/20' },
  Medium: { dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10 border border-warning/20' },
  Low: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/10 border border-success/20' },
};

const filterOptions = [
  { value: 'all', label: 'All Severities' },
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

export default function Alerts() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    getAlerts().then(a => { setAlerts(a); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let result = [...alerts];
    if (filter !== 'all') result = result.filter(a => a.severity === filter);
    if (unreadOnly) result = result.filter(a => !a.read);
    return result.sort((a, b) => b.riskScore - a.riskScore);
  }, [alerts, filter, unreadOnly]);

  const markRead = (id: string) => {
    setAlerts(a => a.map(x => x.id === id ? { ...x, read: true } : x));
    toast('Alert marked as read', 'success');
  };
  const markAllRead = () => {
    setAlerts(a => a.map(x => ({ ...x, read: true })));
    toast('All alerts marked as read', 'success');
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">FRAUD ALERT CENTER</h1>
          <p className="text-text-secondary mt-1">Review and manage active security threats.</p>
        </div>

        <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-danger">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-danger/10 flex items-center justify-center text-danger border border-danger/20">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary tracking-wide uppercase">{unreadCount} UNREAD ALERTS</p>
              <p className="text-xs font-medium text-text-secondary">{alerts.length} total alerts detected</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select options={filterOptions} value={filter} onChange={e => setFilter(e.target.value)} />
            <Button variant="secondary" size="sm" onClick={markAllRead}><CheckCheck className="w-4 h-4" /> Mark All Read</Button>
          </div>
        </div>

        <div className="card divide-y divide-border/50">
          {loading ? <LoadingState message="Loading alerts..." /> : (
            filtered.length === 0 ? (
              <EmptyState message="No alerts found" subMessage="You're all caught up" icon={<AlertTriangle className="w-7 h-7" />} />
            ) : (
              filtered.map(alert => {
                const sc = severityColors[alert.severity];
                return (
                  <div key={alert.id} className={classNames('p-5 flex items-start gap-5 hover:bg-background/50 transition-colors', !alert.read && 'bg-surface/30')}>
                    <div className={classNames('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', sc.bg)}>
                      <AlertTriangle className={classNames('w-5 h-5', sc.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <p className="text-sm font-bold text-text-primary">{alert.title}</p>
                        <Badge variant={alert.severity === 'Critical' || alert.severity === 'High' ? 'danger' : alert.severity === 'Medium' ? 'warning' : 'success'}>
                          <span className={classNames('w-1.5 h-1.5 rounded-full', sc.dot)} /> {alert.severity}
                        </Badge>
                        {!alert.read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                      <p className="text-sm text-text-secondary">{alert.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        <Link to={`/transactions/${alert.transactionId}`} className="font-mono text-primary hover:text-opacity-80">Tx ID: {alert.transactionId}</Link>
                        <span>•</span>
                        <span>Risk Score: <span className={classNames('font-bold', sc.text)}>{alert.riskScore}</span></span>
                        <span>•</span>
                        <span>{alert.time}</span>
                      </div>
                    </div>
                    {!alert.read && (
                      <Button variant="ghost" size="sm" onClick={() => markRead(alert.id)} className="shrink-0 text-xs">Mark Read</Button>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
