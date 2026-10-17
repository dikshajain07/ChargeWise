import React from 'react';
import { AlertTriangleIcon, CheckCircle2Icon, FlaskConicalIcon, InfoIcon, XCircleIcon } from 'lucide-react';

type NoticeTone = 'info' | 'ok' | 'warn' | 'error' | 'sim';

const STYLES: Record<NoticeTone, string> = {
  info: 'border-accent/40 bg-accent/5 text-ink',
  ok: 'border-go/40 bg-go/5 text-ink',
  warn: 'border-warn/45 bg-warn/5 text-ink',
  error: 'border-danger/45 bg-danger/5 text-ink',
  sim: 'border-warn/40 bg-warn/5 text-ink'
};

const ICONS: Record<NoticeTone, React.ReactNode> = {
  info: <InfoIcon className="h-4 w-4 text-accent" />,
  ok: <CheckCircle2Icon className="h-4 w-4 text-go" />,
  warn: <AlertTriangleIcon className="h-4 w-4 text-warn" />,
  error: <XCircleIcon className="h-4 w-4 text-danger" />,
  sim: <FlaskConicalIcon className="h-4 w-4 text-warn" />
};

interface NoticeProps {
  tone?: NoticeTone;
  children: React.ReactNode;
  className?: string;
  role?: 'status' | 'alert';
}

export function Notice({ tone = 'info', children, className = '', role }: NoticeProps) {
  return (
    <div role={role} className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm ${STYLES[tone]} ${className}`}>
      <span className="mt-0.5 shrink-0" aria-hidden>
        {ICONS[tone]}
      </span>
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>);

}