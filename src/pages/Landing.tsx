import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Activity, AlertTriangle, ScanSearch, Bell, BarChart3, Lock, Zap, Eye, TrendingUp } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import { mockDashboardStats, transactionActivity7Days, fraudDistribution } from '@/data/mockData';
import { formatNumber, formatPercent } from '@/utils/helpers';
import { AreaChart, Area, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

const features = [
  { icon: Zap, title: 'Real-Time Fraud Detection', desc: 'Instantly analyze transactions as they happen with AI-powered detection engines.' },
  { icon: TrendingUp, title: 'Risk Scoring', desc: 'Every transaction receives a precise risk score from 0-100 based on behavioral analysis.' },
  { icon: Activity, title: 'Transaction Monitoring', desc: 'Continuous monitoring of all transaction activity with live dashboards and alerts.' },
  { icon: Bell, title: 'Fraud Alerts', desc: 'Get instant notifications when suspicious or fraudulent activity is detected.' },
  { icon: BarChart3, title: 'Behavioral Analytics', desc: 'Deep insights into transaction patterns and user behavior across your platform.' },
  { icon: Lock, title: 'Security Insights', desc: 'Comprehensive security reporting and threat intelligence at your fingertips.' },
];

const steps = [
  { icon: ScanSearch, label: 'Transaction', desc: 'A transaction is initiated' },
  { icon: Activity, label: 'Risk Analysis', desc: 'Behavioral patterns analyzed' },
  { icon: Zap, label: 'AI Detection', desc: 'ML model evaluates risk' },
  { icon: TrendingUp, label: 'Risk Score', desc: 'Score from 0-100 assigned' },
  { icon: AlertTriangle, label: 'Fraud Alert', desc: 'Suspicious activity flagged' },
];

const stats = [
  { label: 'Transactions Analyzed', value: formatNumber(mockDashboardStats.totalTransactions) },
  { label: 'Fraud Detected', value: formatNumber(mockDashboardStats.fraud) },
  { label: 'Detection Accuracy', value: '99.2%' },
  { label: 'Avg Response Time', value: '< 50ms' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-950">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-ink-950/80 backdrop-blur-md border-b border-ink-700/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between py-4">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-ink-300 hover:text-ink-100 transition-colors">Features</a>
            <a href="#how" className="text-sm text-ink-300 hover:text-ink-100 transition-colors">How It Works</a>
            <a href="#stats" className="text-sm text-ink-300 hover:text-ink-100 transition-colors">Statistics</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-[120px] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-medium mb-6">
                <ShieldCheck className="w-3.5 h-3.5" />
                AI-Powered Fraud Detection Platform
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-ink-100 leading-tight tracking-tight">
                Detect Fraud Before<br />It Becomes a Threat
              </h1>
              <p className="text-base lg:text-lg text-ink-300 mt-5 max-w-lg leading-relaxed">
                An intelligent transaction monitoring platform that analyzes transaction behavior, identifies suspicious activity and provides real-time risk insights.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link to="/register" className="btn-primary text-base px-6 py-3">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/dashboard" className="btn-secondary text-base px-6 py-3">
                  <Eye className="w-4 h-4" /> Explore Dashboard
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-10 text-sm text-ink-400">
                <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-success-500" /> Bank-grade Security</div>
                <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-accent-400" /> Real-time Analysis</div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="animate-fade-in-up animation-delay-100">
              <div className="card p-5 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-critical-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-warning-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
                  </div>
                  <span className="text-xs text-ink-400 font-mono">live-monitor.shield.ai</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Total', value: formatNumber(mockDashboardStats.totalTransactions), color: 'text-ink-100' },
                    { label: 'Suspicious', value: formatNumber(mockDashboardStats.suspicious), color: 'text-warning-500' },
                    { label: 'Fraud', value: formatNumber(mockDashboardStats.fraud), color: 'text-critical-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-ink-850 rounded-lg p-3">
                      <p className="text-xs text-ink-400">{s.label}</p>
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-ink-850 rounded-lg p-3 mb-3">
                  <p className="text-xs text-ink-400 mb-2">Transaction Activity</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={transactionActivity7Days}>
                      <defs>
                        <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2} fill="url(#heroGrad)" />
                      <Tooltip contentStyle={{ background: '#141417', border: '1px solid #2a2a30', borderRadius: '8px' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-ink-850 rounded-lg p-3 flex items-center gap-3">
                    <ResponsiveContainer width={60} height={60}>
                      <PieChart>
                        <Pie data={fraudDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={18} outerRadius={28} stroke="none">
                          {fraudDistribution.map(d => <Cell key={d.name} fill={d.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div>
                      <p className="text-xs text-ink-400">Fraud Rate</p>
                      <p className="text-sm font-bold text-critical-400">{formatPercent(mockDashboardStats.fraudRate)}</p>
                    </div>
                  </div>
                  <div className="flex-1 bg-ink-850 rounded-lg p-3">
                    <p className="text-xs text-ink-400">Status</p>
                    <p className="text-sm font-bold text-success-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse-soft" /> Monitoring
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t border-ink-700/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ink-100">Powerful Fraud Detection Features</h2>
            <p className="text-ink-400 mt-3 max-w-2xl mx-auto">Everything you need to monitor, detect, and prevent fraudulent transactions in real time.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card card-hover p-6 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="w-11 h-11 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400 mb-4">
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="text-base font-semibold text-ink-100">{f.title}</h3>
                  <p className="text-sm text-ink-400 mt-2 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 border-t border-ink-700/40 bg-ink-900/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-ink-100">How It Works</h2>
            <p className="text-ink-400 mt-3">From transaction to alert in milliseconds.</p>
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col lg:flex-row items-center gap-4 lg:gap-2 flex-1">
                  <div className="card p-6 text-center w-full max-w-[200px] animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="w-12 h-12 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400 mx-auto mb-3">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink-100">{s.label}</h3>
                    <p className="text-xs text-ink-400 mt-1">{s.desc}</p>
                  </div>
                  {i < steps.length - 1 && <ArrowRight className="w-5 h-5 text-ink-500 rotate-90 lg:rotate-0 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 border-t border-ink-700/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ink-100">Security Statistics</h2>
            <p className="text-ink-400 mt-3">Real-time metrics from our fraud detection engine.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map(s => (
              <div key={s.label} className="card p-6 text-center animate-fade-in-up">
                <p className="text-3xl lg:text-4xl font-bold text-accent-400">{s.value}</p>
                <p className="text-sm text-ink-400 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-ink-700/40">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-ink-100">Start Protecting Your Transactions Today</h2>
          <p className="text-ink-400 mt-3 max-w-xl mx-auto">Join the platform that helps banks and fintechs detect fraud before it impacts their customers.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link to="/register" className="btn-primary text-base px-6 py-3">Create an Account <ArrowRight className="w-4 h-4" /></Link>
            <Link to="/login" className="btn-secondary text-base px-6 py-3">Sign In</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-700/40 py-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-ink-400">© 2026 FraudShield AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
