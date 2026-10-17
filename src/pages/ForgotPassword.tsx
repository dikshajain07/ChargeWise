import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AccountsNotConfigured } from '../components/auth/AccountsNotConfigured';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ChargingLoader } from '../components/arcade/ChargingLoader';
import { Notice } from '../components/arcade/Notice';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPassword() {
  const { configured, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setFormError(null);
    setLoading(true);
    const r = await requestPasswordReset(email.trim());
    setLoading(false);
    if (r.error) setFormError(r.error);else
    setSent(true);
  };

  return (
    <AuthLayout title="RESET PASSWORD" subtitle="Enter your account email and we’ll send a link to choose a new password.">
      {!configured ?
      <AccountsNotConfigured /> :
      sent ?
      <Notice tone="ok" role="status">
          If an account exists for <strong>{email}</strong>, a reset link is on its way. It may take a few minutes to arrive.
        </Notice> :
      loading ?
      <ChargingLoader label="Sending link" className="py-10" /> :

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
            aria-invalid={!!error}
            aria-describedby="email-msg"
            onChange={(e) => setEmail(e.target.value)} />
          
            <p id="email-msg" className="mt-1 text-xs text-danger" role={error ? 'alert' : undefined}>
              {error}
            </p>
          </div>
          <ArcadeButton type="submit" variant="primary" size="lg" className="w-full">
            <MailIcon className="h-4 w-4" aria-hidden />
            Send reset link
          </ArcadeButton>
        </form>
      }
      <p className="mt-5 text-center text-sm text-muted">
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>);

}