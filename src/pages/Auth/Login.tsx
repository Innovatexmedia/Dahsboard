import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, TrendingUp, MessageCircle, Sparkles } from 'lucide-react';
import { useStore } from '@/store/store';
import { Button, Input, Field } from '@/components/ui';
import { toast } from '@/store/toastStore';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'super@innovatex.com', desc: 'Full platform access + tenant management' },
  { label: 'Tenant Owner', email: 'owner@demo.com', desc: 'Full workspace access' },
  { label: 'Sales User', email: 'sales@demo.com', desc: 'Leads, pipeline & WhatsApp' },
];

export function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState('owner@demo.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const user = login(email, password);
      setLoading(false);
      if (user) {
        toast.success(`Welcome back, ${user.name.split(' ')[0]}!`, `Signed in as ${user.role}`);
        navigate(user.role === 'Super Admin' ? '/super-admin' : '/dashboard');
      } else {
        toast.error('Invalid credentials', 'Try a demo account below');
      }
    }, 500);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 shadow-lg">
            <Zap size={20} fill="white" />
          </div>
          <div>
            <p className="text-lg font-bold">InnovateX</p>
            <p className="text-xs font-medium text-brand-300">Revenue OS</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">The source-to-revenue operating system.</h1>
          <p className="mt-4 text-lg text-ink-300">
            Capture, qualify, nurture and close — across WhatsApp, your pipeline and every channel. AI-native, attribution-complete, revenue-focused.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: MessageCircle, text: 'Native WhatsApp panel + 8 provider integrations' },
              { icon: Sparkles, text: 'AI qualification, scoring & call intelligence' },
              { icon: TrendingUp, text: 'Source-to-revenue attribution & leakage alerts' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-ink-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <f.icon size={16} />
                </span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-ink-400">© 2026 InnovateX. Investor demo build — all integrations simulated.</p>
      </div>

      {/* Right form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white">
                <Zap size={18} fill="white" />
              </div>
              <p className="font-bold text-ink-900">InnovateX Revenue OS</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-ink-900">Sign in</h2>
          <p className="mt-1 text-sm text-ink-500">Welcome back. Enter your credentials to continue.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Demo accounts · password123</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  onClick={() => { setEmail(a.email); setPassword('password123'); }}
                  className="flex w-full items-center justify-between rounded-lg border border-ink-200 px-3 py-2.5 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink-800">{a.label}</span>
                    <span className="block text-xs text-ink-500">{a.desc}</span>
                  </span>
                  <span className="text-xs font-mono text-ink-400">{a.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
