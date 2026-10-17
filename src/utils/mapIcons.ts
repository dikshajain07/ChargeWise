import L from 'leaflet';
import { SIM_NOTE } from '../data/stations';
import type { ConnectorTypeId, EvaluatedStation, Origin } from '../types/planner';
import { esc, fmtHour, fmtKm, fmtMin, fmtPct, fmtPrice, fmtRs } from './format';

const PATHS = {
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>'
};

export function svgIcon(name: keyof typeof PATHS, size = 14): string {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PATHS[name] + '</svg>';
}

interface IconState {
  fast: boolean;
  online: boolean;
  reachable?: boolean;
  free?: boolean;
}

export function stationIcon(e: IconState, isBest: boolean, numberLabel?: string): L.DivIcon {
  const cls = ['mk'];
  if (!e.online) cls.push('mk-off');else
  if (e.reachable === false) cls.push('mk-out');else
  if (e.free === false) cls.push('mk-busy');
  if (isBest) cls.push('mk-best');
  if (numberLabel) cls.push('mk-num');
  const inner = numberLabel ? '<b>' + numberLabel + '</b>' : '<span>' + svgIcon(e.fast ? 'zap' : 'plug', 13) + '</span>';
  const size = isBest || numberLabel ? 32 : 24;
  return L.divIcon({
    className: 'mk-wrap',
    html: '<div class="' + cls.join(' ') + '">' + inner + '</div>',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

export function originIcon(): L.DivIcon {
  return L.divIcon({ className: 'mk-wrap', html: '<div class="mk-user"><span></span></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
}

export function destIcon(): L.DivIcon {
  return L.divIcon({ className: 'mk-wrap', html: '<div class="mk-dest">' + svgIcon('flag', 22) + '</div>', iconSize: [32, 32], iconAnchor: [8, 28] });
}

export function originLabel(o: Origin): string {
  return o.source === 'preset' ? 'Preset start: ' + o.name : 'Your location (GPS' + (o.accuracy ? ', ±' + Math.round(o.accuracy) + ' m' : '') + ')';
}

export function stationPopupHtml(e: EvaluatedStation, connectors: ConnectorTypeId[], hour: number): string {
  const rows = e.connectors.
  map((c) => {
    const ok = connectors.indexOf(c.type) !== -1;
    const sel = e.conn && e.conn.type === c.type;
    return (
      '<tr class="' + (ok ? 'is-ok' : 'is-inc') + (sel ? ' is-sel' : '') + '">' +
      '<td>' + (ok ? '✓ ' : '✕ ') + esc(c.type) + '</td>' +
      '<td>' + c.kw + ' kW</td>' +
      '<td>' + (e.online ? c.available + '/' + c.count : '—') + '</td>' +
      '<td>' + fmtPrice(c.price) + '</td></tr>');

  }).
  join('');
  let reach: string;
  if (!e.online) reach = '<div class="pop-reach no">Offline (simulated maintenance)</div>';else
  if (!e.reachable) reach = '<div class="pop-reach no">' + esc(e.reason) + '</div>';else
  if (e.free && e.conn)
  reach = '<div class="pop-reach ok">Compatible · ' + e.conn.available + ' ' + esc(e.conn.type) + ' plug' + (e.conn.available > 1 ? 's' : '') + ' free · arrive with ~' + Math.round(e.arrivalPct) + '%</div>';else
  reach = '<div class="pop-reach busy">Compatible but busy · est. wait ~' + fmtMin(e.cWait) + (e.conn ? ' for ' + esc(e.conn.type) : '') + '</div>';
  const estimate =
  e.reachable && e.conn ?
  '<div class="pop-est">Using <strong>' + esc(e.conn.type) + ' ' + e.conn.kw + ' kW</strong> at ' + fmtPrice(e.conn.price) + ' · ~' + e.charge.kwh.toFixed(1) + ' kWh to ' + e.charge.toPct + '% ≈ <strong>' + fmtRs(e.charge.cost) + '</strong></div>' :
  '';
  return (
    '<div class="pop">' +
    '<div class="pop-h"><strong>' + esc(e.name) + '</strong><span class="pop-chip ' + (e.fast ? 'st-low' : 'st-offline') + '">' + (e.fast ? 'Fast DC' : 'Standard') + '</span></div>' +
    '<div class="pop-sub">' + esc(e.area) + ' · <span class="st-' + e.level + '">' + e.status + '</span></div>' +
    '<table><thead><tr><th scope="col">Connector</th><th scope="col">Speed</th><th scope="col">Free</th><th scope="col">Price</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<div class="pop-sub" style="margin-top:6px">' + (
    e.online ? 'Est. utilisation ' + fmtPct(e.util) + ' · ' + e.level + ' demand<br/>' : '') +
    'Distance ' + fmtKm(e.straightKm) + ' straight-line (~' + fmtKm(e.estDist) + ' est.)</div>' +
    reach + estimate +
    '<div class="pop-note">' + SIM_NOTE + ' Model time ' + fmtHour(hour) + '.</div>' +
    '</div>');

}