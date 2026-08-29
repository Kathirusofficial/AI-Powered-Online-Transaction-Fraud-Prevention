import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      toast('Welcome back! Redirecting to dashboard...', 'success');
      navigate('/dashboard');
    } else {
      toast(res.error || 'Login failed', 'error');
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-surface border-r border-border p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <Logo size="lg" />
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-text-primary leading-tight tracking-tight">AI-Powered Transaction<br />Fraud Detection</h2>
          <p className="text-text-secondary mt-6 max-w-md text-lg">Monitor transactions in real time, detect suspicious activity, and prevent fraud before it happens.</p>
          <div className="flex items-center gap-8 mt-12">
            <div>
              <p className="text-3xl font-bold text-primary">99.2%</p>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest mt-1">Detection Accuracy</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-3xl font-bold text-primary">&lt;50ms</p>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest mt-1">Response Time</p>
            </div>
          </div>
        </div>
        <p className="text-sm font-medium text-text-secondary relative z-10">© 2026 FraudShield AI</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10 animate-fade-in-up">
          <div className="lg:hidden mb-10"><Logo size="md" /></div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Welcome Back</h1>
          <p className="text-text-secondary mt-2">Sign in to your FraudShield AI account</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="you@company.com"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={errors.email}
            />
            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                icon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="mt-2 text-xs font-semibold text-primary hover:opacity-80 flex items-center gap-1.5 uppercase tracking-wider"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPassword ? 'Hide' : 'Show'} password
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary cursor-pointer transition-colors" />
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-sm font-semibold text-primary hover:opacity-80">Forgot password?</button>
            </div>

            <Button type="submit" size="lg" className="w-full mt-4" disabled={loading}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-surface border-t-transparent rounded-full animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-sm text-text-secondary font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:opacity-80 font-bold ml-1">Create one</Link>
          </p>

          <div className="mt-8 p-4 rounded-lg bg-surface border border-border flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-text-secondary leading-relaxed">
              Demo mode: use any email and password (6+ chars). Use an email starting with <strong className="text-text-primary font-mono bg-background px-1 py-0.5 rounded border border-border">admin</strong> to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
