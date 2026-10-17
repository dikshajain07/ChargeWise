import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogInIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordField } from '../components/auth/PasswordField';
import { AccountsNotConfigured } from '../components/auth/AccountsNotConfigured';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ChargingLoader } from '../components/arcade/ChargingLoader';
import { Notice } from '../components/arcade/Notice';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login() {
  const { configured, user, signIn } = useAuth();
  const { play } = useSound();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as {from?: string;} | null)?.from;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{email?: string;password?: string;}>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user && !loading) return <Navigate to={from ?? '/dashboard'} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;
    setLoading(true);
    const r = await signIn(email.trim(), password, remember);
    setLoading(false);
    if (r.error) {
      play('error');
      setFormError(r.error === 'Invalid login credentials' ? 'That email and password don’t match an account.' : r.error);
      return;
    }
    play('start');
    navigate(from ?? '/welcome', { replace: true });
  };

  return (
    <AuthLayout title="PLAYER LOGIN" subtitle="Welcome back. Log in to load your garage and journeys.">
      {!configured ?
      <AccountsNotConfigured /> :
      loading ?
      <ChargingLoader label="Signing in" className="py-10" /> :

      <form onSubmit={submit} noValidate className="space-y-4">
          {formError &&
        <Notice tone="error" role="alert">
              {formError}
            </Notice>
        }
          <div>
            <label htmlFor="email" className="cw-label">
              Email
            </label>
            <input
            id="email"
            type="email"
            className="cw-input mt-1.5"
            autoComplete="email"
            value={email}
            aria-invalid={!!errors.email}
            aria-describedby="email-msg"
            onChange={(e) => setEmail(e.target.value)} />
          
            <p id="email-msg" className="mt-1 text-xs text-danger" role={errors.email ? 'alert' : undefined}>
              {errors.email}
            </p>
          </div>
          <PasswordField id="password" label="Password" value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--cw-accent))]" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Keep me signed in
            </label>
            <Link to="/forgot-password" className="text-sm font-semibold text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <ArcadeButton type="submit" variant="primary" size="lg" className="w-full">
            <LogInIcon className="h-4 w-4" aria-hidden />
            Log in
          </ArcadeButton>
          <p className="text-center text-sm text-muted">
            New to ChargeWise?{' '}
            <Link to="/signup" className="font-semibold text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      }
    </AuthLayout>);

}