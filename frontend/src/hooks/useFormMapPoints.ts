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
  isRefreshing: boolean;
  error: string | null;
  reload: () => void;
} {
  const [points, setPoints] = useState<FormMapPointItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loadState, setLoadState] = useState<FormMapPointsLoadState>("idle");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

  const queryKey = JSON.stringify(query);

  const load = useCallback(async () => {
    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;

    if (!online) {
      setPoints([]);
      setTotal(0);
      setIsRefreshing(false);
      setLoadState("offline");
      setError(null);
      hasLoadedOnceRef.current = false;
      return;
    }
    if (!token) {
      setPoints([]);
      setTotal(0);
      setIsRefreshing(false);
      setLoadState("no_session");
      setError(null);
      hasLoadedOnceRef.current = false;
      return;
    }
    if (!query.municipios?.length) {
      setPoints([]);
      setTotal(0);
      setIsRefreshing(false);
      setLoadState("needs_municipios");
      setError(null);
      return;
    }

    const reqId = ++requestIdRef.current;
    const background = hasLoadedOnceRef.current;

    if (background) {
      setIsRefreshing(true);
    } else {
      setLoadState("loading");
    }
    setError(null);

    try {
      const data = await fetchFormMapPointsFromApi(query);
      if (reqId !== requestIdRef.current) {
        return;
      }
      setPoints(data.items);
      setTotal(data.total);
      setIsRefreshing(false);
      setLoadState("ready");
      hasLoadedOnceRef.current = true;
    } catch (e) {
      if (reqId !== requestIdRef.current) {
        return;
      }
      setIsRefreshing(false);
      const message =
        e instanceof Error ? e.message : "Error al cargar puntos del mapa";
      if (background) {
        setError(message);
        setLoadState("ready");
        return;
      }
      setPoints([]);
      setTotal(0);
      setLoadState("error");
      setError(message);
    }
  }, [online, query]);

  useEffect(() => {
    if (!online) {
      setLoadState("offline");
      setIsRefreshing(false);
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

  return { points, total, loadState, isRefreshing, error, reload: load };
}
