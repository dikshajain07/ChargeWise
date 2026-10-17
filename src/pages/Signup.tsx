import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { MailCheckIcon, UserPlusIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordField } from '../components/auth/PasswordField';
import { AccountsNotConfigured } from '../components/auth/AccountsNotConfigured';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ChargingLoader } from '../components/arcade/ChargingLoader';
import { Notice } from '../components/arcade/Notice';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Field = 'name' | 'email' | 'password' | 'confirm' | 'terms';

export function Signup() {
  const { configured, user, signUp } = useAuth();
  const { play } = useSound();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  if (user && !loading && !confirmSent) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const e: Partial<Record<Field, string>> = {};
    if (name.trim().length < 2) e.name = 'Enter your full name.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address.';
    if (password.length < 8) e.password = 'Use at least 8 characters.';else
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) e.password = 'Include at least one letter and one number.';
    if (confirm !== password) e.confirm = 'Passwords don’t match.';
    if (!terms) e.terms = 'Please accept the terms and privacy policy to continue.';
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;
    setLoading(true);
    const r = await signUp(name.trim(), email.trim(), password);
    setLoading(false);
    if (r.error) {
      play('error');
      setFormError(r.error);
      return;
    }
    play('success');
    if (r.needsConfirmation) setConfirmSent(true);else
    navigate('/onboarding', { replace: true });
  };

  const input = (id: Field, label: string, value: string, set: (v: string) => void, type = 'text', autoComplete?: string) =>
  <div>
      <label htmlFor={id} className="cw-label">
        {label}
      </label>
      <input
      id={id}
      type={type}
      className="cw-input mt-1.5"
      autoComplete={autoComplete}
      value={value}
      aria-invalid={!!errors[id]}
      aria-describedby={`${id}-msg`}
      onChange={(e) => set(e.target.value)} />
    
      <p id={`${id}-msg`} className="mt-1 text-xs text-danger" role={errors[id] ? 'alert' : undefined}>
        {errors[id]}
      </p>
    </div>;


  return (
    <AuthLayout title="NEW PLAYER" subtitle="Create an account to save your EV, preferences and journeys.">
      {!configured ?
      <AccountsNotConfigured /> :
      confirmSent ?
      <div className="space-y-4 text-center">
          <MailCheckIcon className="mx-auto h-8 w-8 text-go" aria-hidden />
          <p className="font-semibold">Check your inbox</p>
          <p className="text-sm text-muted">
            We sent a confirmation link to <strong className="text-ink">{email}</strong>. Open it to activate your account, then log in.
          </p>
          <Link to="/login" className="inline-block text-sm font-semibold text-accent hover:underline">
            Go to login
          </Link>
        </div> :
      loading ?
      <ChargingLoader label="Creating account" className="py-10" /> :

      <form onSubmit={submit} noValidate className="space-y-3">
          {formError &&
        <Notice tone="error" role="alert">
              {formError}
            </Notice>
        }
          {input('name', 'Full name', name, setName, 'text', 'name')}
          {input('email', 'Email', email, setEmail, 'email', 'email')}
          <PasswordField id="password" label="Password" value={password} onChange={setPassword} error={errors.password} hint="At least 8 characters with a letter and a number." autoComplete="new-password" />
          <PasswordField id="confirm" label="Confirm password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
          <div>
            <label className="flex items-start gap-2 text-sm">
              <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[rgb(var(--cw-accent))]"
              checked={terms}
              aria-invalid={!!errors.terms}
              aria-describedby="terms-msg"
              onChange={(e) => setTerms(e.target.checked)} />
            
              <span>I agree to the ChargeWise Terms of Service and Privacy Policy.</span>
            </label>
            <p id="terms-msg" className="mt-1 text-xs text-danger" role={errors.terms ? 'alert' : undefined}>
              {errors.terms}
            </p>
          </div>
          <ArcadeButton type="submit" variant="go" size="lg" className="w-full">
            <UserPlusIcon className="h-4 w-4" aria-hidden />
            Create account
          </ArcadeButton>
          <p className="text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent hover:underline">
              Log in
            </Link>
          </p>
        </form>
      }
    </AuthLayout>);

}