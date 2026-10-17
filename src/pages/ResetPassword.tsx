import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRoundIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AccountsNotConfigured } from '../components/auth/AccountsNotConfigured';
import { PasswordField } from '../components/auth/PasswordField';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ChargingLoader } from '../components/arcade/ChargingLoader';
import { Notice } from '../components/arcade/Notice';

export function ResetPassword() {
  const { configured, session, loading: authLoading, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{password?: string;confirm?: string;}>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (password.length < 8) next.password = 'Use at least 8 characters.';else
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) next.password = 'Include at least one letter and one number.';
    if (confirm !== password) next.confirm = 'Passwords don’t match.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;
    setLoading(true);
    const r = await updatePassword(password);
    setLoading(false);
    if (r.error) setFormError(r.error);else
    setDone(true);
  };

  let body: React.ReactNode;
  if (!configured) body = <AccountsNotConfigured />;else
  if (authLoading) body = <ChargingLoader label="Checking link" className="py-10" />;else
  if (!session)
  body =
  <Notice tone="warn">
        Open this page from the password reset link in your email. Links expire — <Link to="/forgot-password" className="font-semibold text-accent underline">request a new one</Link> if needed.
      </Notice>;else

  if (done)
  body =
  <div className="space-y-4">
        <Notice tone="ok" role="status">
          Your password has been updated.
        </Notice>
        <Link to="/dashboard" className="text-sm font-semibold text-accent hover:underline">
          Continue to dashboard
        </Link>
      </div>;else

  if (loading) body = <ChargingLoader label="Saving" className="py-10" />;else

  body =
  <form onSubmit={submit} noValidate className="space-y-4">
        {formError &&
    <Notice tone="error" role="alert">
            {formError}
          </Notice>
    }
        <PasswordField id="password" label="New password" value={password} onChange={setPassword} error={errors.password} hint="At least 8 characters with a letter and a number." autoComplete="new-password" />
        <PasswordField id="confirm" label="Confirm new password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
        <ArcadeButton type="submit" variant="primary" size="lg" className="w-full">
          <KeyRoundIcon className="h-4 w-4" aria-hidden />
          Update password
        </ArcadeButton>
      </form>;


  return (
    <AuthLayout title="NEW PASSWORD" subtitle="Choose a new password for your ChargeWise account.">
      {body}
    </AuthLayout>);

}