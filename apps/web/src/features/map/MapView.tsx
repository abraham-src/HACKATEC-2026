import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection } from 'geojson';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import { Box, LocateFixed, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { registerIcons } from './icons';
import { INTERACTIVE_LAYERS, LAYER_KEYS, MAP_LAYERS, RENDER_ORDER, type LayerKey } from './layers';
import { popupHtml } from './popup';
import { EMPTY_FC } from './sources';
import { useMapUi } from './store';
import { buildBaseStyle } from './style';

export type MapSources = Record<
  'devices' | 'incidents' | 'access' | 'routes' | 'flood',
  FeatureCollection
>;

/** Roma Norte / Condesa / Centro in view, tilted to show the 3D skyline. */
const HOME = {
  center: [-99.1545, 19.4225] as [number, number],
  zoom: 13.6,
  pitch: 52,
  bearing: -18,
};

export function MapView({
  sources,
  hiddenKeys,
}: {
  sources: MapSources;
  hiddenKeys: readonly LayerKey[];
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const latest = useRef(sources);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const visible = useMapUi((s) => s.visible);
  const pitched = useMapUi((s) => s.pitched);
  const focus = useMapUi((s) => s.focus);
  const setPitched = useMapUi((s) => s.setPitched);

  latest.current = sources;

  // Create the map once.
  useEffect(() => {
    if (!container.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: buildBaseStyle(),
      ...HOME,
      maxPitch: 70,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    // Dev/E2E hook to inspect the map from the browser (never in production builds).
    if (import.meta.env.DEV) (window as unknown as { __simuMap?: MapLibreMap }).__simuMap = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 110 }), 'bottom-left');

    map.on('error', (e) => {
      // Tile hiccups are transient; only surface a style/load failure.
      if (!map.isStyleLoaded())
        setLoadError((e.error as Error | undefined)?.message ?? 'No se pudo cargar el mapa base');
    });

    map.on('load', () => {
      void registerIcons(map).then(() => {
        for (const id of ['devices', 'incidents', 'access', 'routes', 'flood'] as const) {
          map.addSource(id, { type: 'geojson', data: latest.current[id] ?? EMPTY_FC });
        }
        for (const key of RENDER_ORDER) for (const layer of MAP_LAYERS[key]) map.addLayer(layer);

        for (const id of INTERACTIVE_LAYERS) {
          map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'));
          map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''));
        }
        map.on('click', (e) => {
          const layers = INTERACTIVE_LAYERS.filter((id) => map.getLayer(id));
          const [feature] = map.queryRenderedFeatures(e.point, { layers });
          if (!feature) return;
          popupRef.current?.remove();
          popupRef.current = new maplibregl.Popup({
            maxWidth: '320px',
            className: 'simu-popup-wrap',
          })
            .setLngLat(e.lngLat)
            .setHTML(popupHtml(feature.properties ?? {}))
            .addTo(map);
        });
        setReady(true);
      });
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Live data: the query cache is patched by WebSocket messages, so this runs on every
  // drain reading / status change without a page reload (spec §7.4).
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    for (const [id, data] of Object.entries(sources)) {
      (map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
    }
  }, [ready, sources]);

  // Layer toggles.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    for (const key of LAYER_KEYS) {
      const show = visible[key] && !hiddenKeys.includes(key);
      for (const layer of MAP_LAYERS[key]) {
        if (map.getLayer(layer.id))
          map.setLayoutProperty(layer.id, 'visibility', show ? 'visible' : 'none');
      }
    }
  }, [ready, visible, hiddenKeys]);

  // 2D / 3D
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.easeTo({
      pitch: pitched ? HOME.pitch : 0,
      bearing: pitched ? HOME.bearing : 0,
      duration: 600,
    });
    if (map.getLayer('building-3d')) {
      map.setPaintProperty(
        'building-3d',
        'fill-extrusion-height',
        pitched ? ['coalesce', ['get', 'render_height'], 6] : 0,
      );
    }
  }, [ready, pitched]);

  // Focus requests from the incident panel.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !focus) return;
    map.flyTo({ center: [focus.lng, focus.lat], zoom: Math.max(map.getZoom(), 16), duration: 900 });
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({ maxWidth: '320px', className: 'simu-popup-wrap' })
      .setLngLat([focus.lng, focus.lat])
      .setHTML(focus.html)
      .addTo(map);
  }, [ready, focus]);

  return (
    <div className="relative h-full w-full bg-base">
      {/* Explicit size: maplibre-gl.css forces position:relative on this node, so inset-0 would collapse it. */}
      <div ref={container} className="h-full w-full" aria-label="Mapa de la Ciudad de México" />
      {!ready && !loadError && (
        <div className="pointer-events-none absolute left-3 top-3 border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg-muted">
          Cargando mapa base…
        </div>
      )}
      {loadError && (
        <div
          role="alert"
          className="absolute left-3 top-3 border border-danger/50 bg-surface px-2 py-1 text-[12px] text-critical"
        >
          Mapa base no disponible ({loadError}). Las capas operativas siguen actualizándose.
        </div>
      )}
      <div
        className="absolute left-3 top-3 flex flex-col gap-1"
        style={{ marginTop: !ready || loadError ? 32 : 0 }}
      >
        <button
          type="button"
          onClick={() => setPitched(!pitched)}
          className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-2 py-1 text-[12px] text-fg hover:border-accent"
          title={pitched ? 'Vista 2D' : 'Vista 3D con edificios'}
        >
          {pitched ? (
            <Square size={13} strokeWidth={1.5} aria-hidden />
          ) : (
            <Box size={13} strokeWidth={1.5} aria-hidden />
          )}
          {pitched ? '2D' : '3D'}
        </button>
        <button
          type="button"
          onClick={() =>
            mapRef.current?.flyTo({
              ...HOME,
              pitch: pitched ? HOME.pitch : 0,
              bearing: pitched ? HOME.bearing : 0,
            })
          }
          className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-2 py-1 text-[12px] text-fg hover:border-accent"
          title="Recentrar"
        >
          <LocateFixed size={13} strokeWidth={1.5} aria-hidden /> Centrar
        </button>
      </div>
    </div>
  );
}
