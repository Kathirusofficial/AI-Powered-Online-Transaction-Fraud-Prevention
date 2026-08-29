import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Check, X } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { classNames } from '@/utils/helpers';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);

  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-ink-700', 'bg-critical-500', 'bg-warning-500', 'bg-accent-500', 'bg-success-500'];

  const checks = [
    { ok: password.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(password), label: 'Uppercase letter' },
    { ok: /[0-9]/.test(password), label: 'Number' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'Special character' },
  ];

  const validate = () => {
    const e: typeof errors = {};
    if (!name) e.name = 'Full name is required';
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!confirm) e.confirm = 'Please confirm your password';
    else if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);
    if (res.ok) {
      toast('Account created! Redirecting to login...', 'success');
      navigate('/login');
    } else {
      toast(res.error || 'Registration failed', 'error');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-ink-900 border-r border-ink-700/60 p-12 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-[100px] opacity-40" />
        <Logo size="lg" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-ink-100 leading-tight">Join the platform<br />securing transactions</h2>
          <p className="text-ink-400 mt-4 max-w-md">Create your account to start monitoring transactions and detecting fraud with AI-powered insights.</p>
          <div className="space-y-3 mt-8">
            {['Real-time fraud detection', 'Comprehensive risk scoring', 'Behavioral analytics dashboard'].map(t => (
              <div key={t} className="flex items-center gap-2 text-ink-300">
                <Check className="w-4 h-4 text-success-500" /> {t}
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-ink-400 relative">© 2026 FraudShield AI</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden mb-8"><Logo size="md" /></div>
          <h1 className="text-2xl font-bold text-ink-100">Create Account</h1>
          <p className="text-ink-400 mt-1.5">Get started with FraudShield AI</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input label="Full Name" name="name" placeholder="John Doe" icon={<User className="w-4 h-4" />} value={name} onChange={e => setName(e.target.value)} error={errors.name} />
            <Input label="Email" type="email" name="email" placeholder="you@company.com" icon={<Mail className="w-4 h-4" />} value={email} onChange={e => setEmail(e.target.value)} error={errors.email} />
            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create a password"
                icon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={errors.password}
              />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1.5">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={classNames('h-1 flex-1 rounded-full transition-colors', i < strength ? strengthColors[strength] : 'bg-ink-700')} />
                    ))}
                  </div>
                  <p className="text-xs text-ink-400">{strengthLabels[strength]}</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {checks.map(c => (
                      <div key={c.label} className="flex items-center gap-1.5 text-xs">
                        {c.ok ? <Check className="w-3 h-3 text-success-500" /> : <X className="w-3 h-3 text-ink-500" />}
                        <span className={c.ok ? 'text-ink-300' : 'text-ink-500'}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button type="button" onClick={() => setShowPassword(s => !s)} className="mt-2 text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1">
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPassword ? 'Hide' : 'Show'} password
              </button>
            </div>
            <Input label="Confirm Password" type={showPassword ? 'text' : 'password'} name="confirm" placeholder="Re-enter password" icon={<Lock className="w-4 h-4" />} value={confirm} onChange={e => setConfirm(e.target.value)} error={errors.confirm} />

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-ink-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-400 hover:text-accent-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
