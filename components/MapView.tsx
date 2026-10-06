"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { TILE_ATTRIBUTION, TILE_URL } from "@/lib/dgt/config";
import type { IncidentType, TrafficIncident } from "@/lib/dgt/types";
import { TYPE_META } from "@/lib/incidents/labels";

interface Props {
  incidents: TrafficIncident[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  initialView: { center: [number, number]; zoom: number };
  /** Se incrementa cuando el usuario cambia filtros: el mapa encuadra los resultados. */
  fitSignal: number;
}

const iconCache = new Map<string, L.DivIcon>();
function pinIcon(type: IncidentType, selected: boolean): L.DivIcon {
  const key = `${type}:${selected}`;
  let icon = iconCache.get(key);
  if (!icon) {
    const m = TYPE_META[type];
    icon = L.divIcon({
      className: "tm-pin-wrap",
      html: `<div class="tm-pin${selected ? " tm-pin-sel" : ""}" data-type="${type}" style="background:${m.color}"><span aria-hidden="true">${m.symbol}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

export default function MapView({ incidents, selectedId, onSelect, initialView, fitSignal }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const types = useRef(new Map<string, IncidentType>());
  const lineRef = useRef<L.Polyline | null>(null);
  const prevSelected = useRef<string | null>(null);
  const signature = useRef("");
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Inicialización del mapa (una sola vez).
  useEffect(() => {
    const el = elRef.current;
    if (!el || mapRef.current) return;
    const map = L.map(el, {
      center: initialView.center,
      zoom: initialView.zoom,
      minZoom: 4,
      preferCanvas: true,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 18 }).addTo(map);

    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (c) => {
        const n = c.getChildCount();
        const size = n < 10 ? 38 : n < 100 ? 44 : 52;
        return L.divIcon({
          html: `<div class="tm-cluster"><span>${n}</span></div>`,
          className: "tm-cluster-wrap",
          iconSize: [size, size],
        });
      },
    });
    map.addLayer(cluster);
    map.on("click", () => onSelectRef.current(null));

    mapRef.current = map;
    clusterRef.current = cluster;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    const snapshot = markers.current;
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      snapshot.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marcadores: solo se reconstruyen si cambian las incidencias visibles.
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    const sig = incidents.map((i) => `${i.id}@${i.lastUpdated ?? ""}`).join("|");
    if (sig === signature.current) return;
    signature.current = sig;

    cluster.clearLayers();
    markers.current.clear();
    types.current.clear();
    const layers: L.Marker[] = [];
    for (const i of incidents) {
      if (i.latitude === null || i.longitude === null) continue;
      const label = [TYPE_META[i.type].label, i.title, i.road, i.kilometer ? `km ${i.kilometer}` : null]
        .filter(Boolean)
        .join(" · ");
      const m = L.marker([i.latitude, i.longitude], {
        icon: pinIcon(i.type, i.id === selectedId),
        title: label,
        alt: label,
        keyboard: true,
      });
      m.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRef.current(i.id);
      });
      markers.current.set(i.id, m);
      types.current.set(i.id, i.type);
      layers.push(m);
    }
    cluster.addLayers(layers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents]);

  // Encuadre al cambiar filtros.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || fitSignal === 0) return;
    const pts = incidents
      .filter((i) => i.latitude !== null && i.longitude !== null)
      .map((i) => [i.latitude as number, i.longitude as number] as [number, number]);
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.15), { maxZoom: 12, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal]);

  // Selección: resalta marcador, dibuja el tramo y centra si hace falta.
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;

    const prev = prevSelected.current ? markers.current.get(prevSelected.current) : null;
    if (prev && prevSelected.current) prev.setIcon(pinIcon(types.current.get(prevSelected.current)!, false));
    lineRef.current?.remove();
    lineRef.current = null;
    prevSelected.current = selectedId;
    if (!selectedId) return;

    const inc = incidents.find((i) => i.id === selectedId);
    const marker = markers.current.get(selectedId);
    if (!inc || !marker) return;
    marker.setIcon(pinIcon(inc.type, true));
    marker.setZIndexOffset(1000);

    if (inc.segment) {
      lineRef.current = L.polyline(inc.segment, {
        color: TYPE_META[inc.type].color, weight: 7, opacity: 0.75,
      }).addTo(map);
    }
    const ll = marker.getLatLng();
    const hidden = cluster.getVisibleParent(marker) !== marker;
    if (hidden) {
      cluster.zoomToShowLayer(marker, () => map.panTo(ll));
    } else if (!map.getBounds().pad(-0.2).contains(ll)) {
      map.flyTo(ll, Math.max(map.getZoom(), 11), { duration: 0.6 });
    }
  }, [selectedId, incidents]);

  return (
    <div
      ref={elRef}
      role="region"
      aria-label="Mapa de incidencias de tráfico"
      className="h-full w-full bg-slate-200"
    />
  );
}
