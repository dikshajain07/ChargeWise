import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { WifiOffIcon } from 'lucide-react';
import { CONFIG, SIM_NOTE } from '../../data/stations';
import { usePlanner } from '../../contexts/PlannerContext';
import { useTheme } from '../../contexts/ThemeContext';
import { destIcon, originIcon, stationIcon } from '../../utils/mapIcons';
import { esc, fmtPrice, fmtRs, fmtWait } from '../../utils/format';
import { readColor } from '../../utils/theme';
import { addTiles } from './StationMap';

export function StopsMap({ className = '' }: {className?: string;}) {
  const { ctx, plan } = usePlanner();
  const { theme } = useTheme();
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const fitKeyRef = useRef('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let map: L.Map;
    try {
      map = L.map(el, { zoomControl: true, scrollWheelZoom: true }).setView(CONFIG.mapCenter, 9);
    } catch {
      setFailed(true);
      return;
    }
    addTiles(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const o = ctx.origin;
    L.marker([o.lat, o.lng], { icon: originIcon(), title: 'Start', zIndexOffset: 800 }).addTo(layer);
    if (!ctx.dest || plan.status === 'no-dest') {
      map.setView([o.lat, o.lng], 10);
      fitKeyRef.current = '';
      return;
    }
    const dest = ctx.dest;
    const pts: Array<[number, number]> = [[o.lat, o.lng]];
    plan.stops.forEach((s, i) => {
      pts.push([s.station.lat, s.station.lng]);
      const e = { ...s.station, reachable: true, free: s.conn.available > 0 };
      L.marker([s.station.lat, s.station.lng], { icon: stationIcon(e, false, String(i + 1)), title: s.station.name, zIndexOffset: 600 }).
      bindPopup(
        '<div class="pop"><div class="pop-h"><strong>Stop ' + (i + 1) + ': ' + esc(s.station.name) + '</strong></div>' +
        '<div class="pop-sub">' + esc(s.conn.type) + ' ' + s.conn.kw + ' kW · ' + fmtPrice(s.conn.price) + ' · ' + s.conn.available + '/' + s.conn.count + ' free at ETA</div>' +
        '<div class="pop-sub">Charge ' + Math.round(s.arrivePct) + '% → ' + s.targetPct + '% · ' + fmtRs(s.charge.cost) + ' · ' + fmtWait(s.wait) + '</div>' +
        '<div class="pop-note">' + SIM_NOTE + ' Straight-line legs, not a road route.</div></div>',
        { maxWidth: 300 }
      ).
      addTo(layer);
    });
    const complete = plan.status === 'ok';
    if (complete) pts.push([dest.lat, dest.lng]);
    L.polyline(pts, { color: readColor('--cw-go'), weight: 4, opacity: 0.95 }).addTo(layer);
    if (!complete) {
      L.polyline([pts[pts.length - 1], [dest.lat, dest.lng]], { color: readColor('--cw-danger'), weight: 3, dashArray: '6 8' }).addTo(layer);
    }
    L.marker([dest.lat, dest.lng], { icon: destIcon(), title: dest.name }).addTo(layer);
    const key = JSON.stringify(pts);
    if (key !== fitKeyRef.current) {
      fitKeyRef.current = key;
      map.fitBounds(L.latLngBounds([...pts, [dest.lat, dest.lng]]), { padding: [40, 40], maxZoom: 12 });
    }
  }, [ctx, plan, theme]);

  return (
    <div className={`hud-panel relative overflow-hidden ${className}`}>
      {failed ?
      <div className="grid h-full min-h-[320px] place-items-center p-6 text-center">
          <div>
            <WifiOffIcon className="mx-auto h-6 w-6 text-warn" aria-hidden />
            <p className="mt-2 font-semibold">Map could not load</p>
            <p className="mt-1 text-sm text-muted">OpenStreetMap tiles need an internet connection. The plan below still works.</p>
          </div>
        </div> :

      <div ref={elRef} className="h-full min-h-[360px] w-full rounded-[7px]" role="region" aria-label="Map of charging plan" />
      }
    </div>);

}