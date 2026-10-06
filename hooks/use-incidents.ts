"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POLL_INTERVAL_SECONDS } from "@/lib/dgt/config";
import type { IncidentsPayload } from "@/lib/dgt/types";

export interface IncidentsState {
  payload: IncidentsPayload | null;
  /** true hasta que termina el primer intento de carga. */
  loading: boolean;
  /** Error del último intento (la UI lo muestra aunque haya datos antiguos). */
  error: string | null;
  refresh: () => void;
}

/** Consulta /api/incidents periódicamente. Se pausa con la pestaña oculta. */
export function useIncidents(): IncidentsState {
  const [payload, setPayload] = useState<IncidentsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastAttempt = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controller.current?.abort();
    const ctl = new AbortController();
    controller.current = ctl;
    lastAttempt.current = Date.now();
    try {
      const res = await fetch("/api/incidents", { cache: "no-store", signal: ctl.signal });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body || !Array.isArray(body.incidents)) {
        throw new Error(body?.error ?? `Error HTTP ${res.status}`);
      }
      setPayload(body as IncidentsPayload);
      setError((body as IncidentsPayload).error);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message || "Error de red");
    } finally {
      if (controller.current === ctl) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const ms = POLL_INTERVAL_SECONDS * 1000;
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, ms);
    const onVisible = () => {
      if (!document.hidden && Date.now() - lastAttempt.current > ms / 2) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      controller.current?.abort();
    };
  }, [load]);

  return { payload, loading, error, refresh: load };
}

/** Reloj que fuerza re-render cada `ms` (para "Actualizado hace X"). */
export function useNow(ms = 10_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
