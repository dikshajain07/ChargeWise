import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  autoComplete: 'current-password' | 'new-password';
}

export function PasswordField({ id, label, value, onChange, error, hint, autoComplete }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="cw-label">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="cw-input pr-11"
          value={value}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={`${id}-msg`}
          onChange={(e) => onChange(e.target.value)} />
        
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-muted hover:text-accent"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}>
          
          {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
      <p id={`${id}-msg`} className={`mt-1 text-xs ${error ? 'text-danger' : 'text-muted'}`} role={error ? 'alert' : undefined}>
        {error ?? hint}
      </p>
    </div>);

}