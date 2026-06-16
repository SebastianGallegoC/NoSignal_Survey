import { useCallback, useEffect, useRef, useState } from "react";

import { ACCESS_TOKEN_KEY } from "@/lib/authStorage";
import {
  fetchFormMapPointsFromApi,
  type FormMapPointItem,
  type FormMapPointsQuery,
} from "@/services/api";

const FILTER_DEBOUNCE_MS = 400;

export type FormMapPointsLoadState =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "offline"
  | "no_session"
  | "needs_municipios";

export function useFormMapPoints(
  query: FormMapPointsQuery,
  online: boolean,
): {
  points: FormMapPointItem[];
  total: number;
  loadState: FormMapPointsLoadState;
  error: string | null;
  reload: () => void;
} {
  const [points, setPoints] = useState<FormMapPointItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loadState, setLoadState] = useState<FormMapPointsLoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const queryKey = JSON.stringify(query);

  const load = useCallback(async () => {
    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;

    if (!online) {
      setPoints([]);
      setTotal(0);
      setLoadState("offline");
      setError(null);
      return;
    }
    if (!token) {
      setPoints([]);
      setTotal(0);
      setLoadState("no_session");
      setError(null);
      return;
    }
    if (!query.municipios?.length) {
      setPoints([]);
      setTotal(0);
      setLoadState("needs_municipios");
      setError(null);
      return;
    }

    const reqId = ++requestIdRef.current;
    setLoadState("loading");
    setError(null);

    try {
      const data = await fetchFormMapPointsFromApi(query);
      if (reqId !== requestIdRef.current) {
        return;
      }
      setPoints(data.items);
      setTotal(data.total);
      setLoadState("ready");
    } catch (e) {
      if (reqId !== requestIdRef.current) {
        return;
      }
      setPoints([]);
      setTotal(0);
      setLoadState("error");
      setError(e instanceof Error ? e.message : "Error al cargar puntos del mapa");
    }
  }, [online, query]);

  useEffect(() => {
    if (!online) {
      setLoadState("offline");
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void load();
    }, FILTER_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [online, queryKey, load]);

  useEffect(() => {
    const onOnline = () => {
      if (online) {
        void load();
      }
    };
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, [online, load]);

  return { points, total, loadState, error, reload: load };
}
