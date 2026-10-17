import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPinIcon, WifiOffIcon } from 'lucide-react';
import { CONFIG } from '../../data/stations';
import { usePlanner } from '../../contexts/PlannerContext';
import { useTheme } from '../../contexts/ThemeContext';
import { destIcon, originIcon, originLabel, stationIcon, stationPopupHtml } from '../../utils/mapIcons';
import { estKm, haversineKm } from '../../utils/demandModel';
import { esc, fmtKm } from '../../utils/format';
import { readColor } from '../../utils/theme';

export const LEGEND_HTML =
'<div class="lg-title">Legend <span>simulated</span></div>' +
'<div class="lg-row"><i class="lg-sw" style="background:rgb(var(--cw-go))"></i>Recommended checkpoint</div>' +
'<div class="lg-row"><i class="lg-sw" style="border:2px solid rgb(var(--cw-accent))"></i>Compatible · plug free</div>' +
'<div class="lg-row"><i class="lg-sw" style="border:2px solid rgb(var(--cw-warn))"></i>Compatible · all busy</div>' +
'<div class="lg-row"><i class="lg-sw" style="border:2px dashed rgb(var(--cw-muted))"></i>Unreachable / offline</div>' +
'<div class="lg-row"><i class="lg-sw" style="background:rgb(var(--cw-xp));border-radius:50%"></i>Start</div>';

export function addTiles(map: L.Map) {
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  const legend = new L.Control({ position: 'bottomleft' });
  legend.onAdd = () => {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = LEGEND_HTML;
    L.DomEvent.disableClickPropagation(div);
    return div;
  };
  legend.addTo(map);
}

export function StationMap({ className = '' }: {className?: string;}) {
  const { ctx, evaluated, ranked, hour, connectors, pickMode, pickDestination, setPickMode, focusId, focusStation } = usePlanner();
  const { theme } = useTheme();
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const openIdRef = useRef<string | null>(null);
  const fitKeyRef = useRef('');
  const pickRef = useRef(pickMode);
  const pickFnRef = useRef(pickDestination);
  const [failed, setFailed] = useState(false);
  pickRef.current = pickMode;
  pickFnRef.current = pickDestination;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let map: L.Map;
    try {
      map = L.map(el, { zoomControl: true, scrollWheelZoom: true }).setView(CONFIG.mapCenter, 10);
    } catch {
      setFailed(true);
      return;
    }
    addTiles(map);
    map.on('click', (ev: L.LeafletMouseEvent) => {
      if (pickRef.current) pickFnRef.current({ lat: ev.latlng.lat, lng: ev.latlng.lng });
    });
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
    const reopen = openIdRef.current;
    layer.clearLayers();
    markersRef.current = {};
    const o = ctx.origin;
    const best = ranked[0];
    const go = readColor('--cw-go');
    const accent = readColor('--cw-accent');

    if (ctx.usableKm > 0) {
      L.circle([o.lat, o.lng], { radius: ctx.usableKm / ctx.rf * 1000, color: go, weight: 1.5, dashArray: '6 6', fillColor: go, fillOpacity: 0.05, interactive: false }).addTo(layer);
    }
    if (ctx.dest) {
      L.polyline([[o.lat, o.lng], [ctx.dest.lat, ctx.dest.lng]], { color: accent, weight: 2, dashArray: '4 8', opacity: 0.7, interactive: false }).addTo(layer);
      L.marker([ctx.dest.lat, ctx.dest.lng], { icon: destIcon(), title: 'Destination' }).
      bindPopup(
        '<div class="pop"><div class="pop-h"><strong>' + esc(ctx.dest.name) + '</strong></div><div class="pop-sub">Destination · ' + fmtKm(haversineKm(o, ctx.dest)) + ' straight-line (~' + fmtKm(estKm(o, ctx.dest, ctx.rf)) + ' est.)</div></div>'
      ).
      addTo(layer);
    }
    if (best) {
      L.polyline([[o.lat, o.lng], [best.lat, best.lng]], { color: go, weight: 4, opacity: 0.9 }).
      bindTooltip('Straight-line guide to the recommended checkpoint — not a road route', { sticky: true }).
      addTo(layer);
    }
    evaluated.forEach((e) => {
      const isBest = !!best && best.id === e.id;
      const mk = L.marker([e.lat, e.lng], { icon: stationIcon(e, isBest), title: e.name, riseOnHover: true, zIndexOffset: isBest ? 500 : e.reachable ? 100 : 0 }).bindPopup(
        stationPopupHtml(e, connectors, hour),
        { maxWidth: 320 }
      );
      mk.on('popupopen', () => openIdRef.current = e.id);
      mk.on('popupclose', () => {
        if (openIdRef.current === e.id) openIdRef.current = null;
      });
      mk.addTo(layer);
      markersRef.current[e.id] = mk;
    });
    const label = originLabel(o);
    L.marker([o.lat, o.lng], { icon: originIcon(), title: label, zIndexOffset: 800 }).
    bindPopup('<div class="pop"><div class="pop-h"><strong>' + esc(label) + '</strong></div><div class="pop-sub">Est. range ' + fmtKm(ctx.remainingKm) + ' · usable above reserve ' + fmtKm(ctx.usableKm) + '</div></div>').
    addTo(layer);

    const fitKey = o.lat + ',' + o.lng + '|' + (ctx.dest ? ctx.dest.lat + ',' + ctx.dest.lng : '');
    if (fitKey !== fitKeyRef.current) {
      fitKeyRef.current = fitKey;
      if (ctx.dest) map.fitBounds(L.latLngBounds([[o.lat, o.lng], [ctx.dest.lat, ctx.dest.lng]]), { padding: [40, 40], maxZoom: 12 });else
      map.setView([o.lat, o.lng], 11);
    }
    if (reopen && markersRef.current[reopen]) markersRef.current[reopen].openPopup();
  }, [ctx, evaluated, ranked, hour, connectors, theme]);

  useEffect(() => {
    mapRef.current?.getContainer().classList.toggle('picking', pickMode);
  }, [pickMode]);

  useEffect(() => {
    if (!focusId) return;
    const map = mapRef.current;
    const mk = markersRef.current[focusId];
    if (map && mk) {
      map.setView(mk.getLatLng(), Math.max(map.getZoom(), 13));
      mk.openPopup();
      elRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    focusStation(null);
  }, [focusId, focusStation]);

  return (
    <div className={`hud-panel relative overflow-hidden ${className}`}>
      {failed ?
      <div className="grid h-full min-h-[320px] place-items-center p-6 text-center">
          <div>
            <WifiOffIcon className="mx-auto h-6 w-6 text-warn" aria-hidden />
            <p className="mt-2 font-semibold">Map could not load</p>
            <p className="mt-1 text-sm text-muted">OpenStreetMap tiles need an internet connection. All calculations still work.</p>
          </div>
        </div> :

      <div ref={elRef} className="h-full min-h-[360px] w-full rounded-[7px]" role="region" aria-label="Map of charging stations" />
      }
      {pickMode &&
      <div className="absolute left-1/2 top-3 z-[500] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-accent bg-surface px-3 py-2 text-xs font-semibold shadow-lg">
          <MapPinIcon className="h-3.5 w-3.5 text-accent" aria-hidden />
          Click the map to set your destination
          <button type="button" className="text-accent underline" onClick={() => setPickMode(false)}>
            Cancel
          </button>
        </div>
      }
    </div>);

}