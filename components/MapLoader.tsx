"use client";

import dynamic from "next/dynamic";

/** Leaflet necesita `window`: se carga solo en el navegador. */
export const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
      Cargando mapa...
    </div>
  ),
});
