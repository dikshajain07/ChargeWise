import type { ConnectorTypeId, Station } from '../types/planner';

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const fmtKm = (km: number) => (km < 10 ? km.toFixed(1) : String(Math.round(km))) + ' km';
export const fmtRs = (v: number) => '₹' + Math.round(v).toLocaleString('en-IN');
export const fmtPct = (v: number) => Math.round(v * 100) + '%';
export const fmtPrice = (p: number) => '₹' + (p % 1 ? p.toFixed(1) : p) + '/kWh';

export function fmtMin(m: number | null | undefined): string {
  if (m == null) return '—';
  if (m < 1) return '<1 min';
  if (m >= 120) return '120+ min';
  if (m >= 60) return Math.floor(m / 60) + ' h ' + Math.round(m % 60) + ' min';
  return Math.round(m) + ' min';
}

export function fmtWait(m: number | null | undefined): string {
  if (m == null) return '—';
  return m === 0 ? 'No wait' : fmtMin(m);
}

export function fmtHour(h: number): string {
  const n = (h % 24 + 24) % 24;
  let hh = Math.floor(n);
  let mm = Math.round((n - hh) * 60);
  if (mm === 60) {
    hh = (hh + 1) % 24;
    mm = 0;
  }
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? h + ' h ' + m + ' min' : m + ' min';
}

export function esc(s: string | number): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(s).replace(/[&<>"']/g, (c) => map[c]);
}

export function priceRange(st: Station): string {
  const ps = st.plugs.map((p) => p.price);
  const mn = Math.min(...ps);
  const mx = Math.max(...ps);
  return mn === mx ? fmtPrice(mn) : '₹' + (mn % 1 ? mn.toFixed(1) : mn) + '–' + (mx % 1 ? mx.toFixed(1) : mx) + '/kWh';
}

export function connectorsLabel(connectors: ConnectorTypeId[]): string {
  return connectors.length ? connectors.join(' + ') : 'no connector selected';
}