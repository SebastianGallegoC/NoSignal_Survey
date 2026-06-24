import { useCallback, useEffect, useRef, useState } from "react";

import { ACCESS_TOKEN_KEY } from "@/lib/authStorage";
import { fetchFormStatsMesesFromApi } from "@/services/api";

export type FormStatsMesesLoadState =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "offline"
  | "no_session";

export function useFormStatsMeses(
  anio: number | null,
  online: boolean,
): {
  meses: number[];
  loadState: FormStatsMesesLoadState;
  reload: () => void;
} {
  const [meses, setMeses] = useState<number[]>([]);
  const [loadState, setLoadState] = useState<FormStatsMesesLoadState>("idle");
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (anio == null) {
      setMeses([]);
      setLoadState("idle");
      return;
    }

    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;

    if (!online) {
      setMeses([]);
      setLoadState("offline");
      return;
    }
    if (!token) {
      setMeses([]);
      setLoadState("no_session");
      return;
    }

    const reqId = ++requestIdRef.current;
    setLoadState("loading");

    try {
      const list = await fetchFormStatsMesesFromApi(anio);
      if (reqId !== requestIdRef.current) {
        return;
      }
      setMeses(list);
      setLoadState("ready");
    } catch {
      if (reqId !== requestIdRef.current) {
        return;
      }
      setMeses([]);
      setLoadState("error");
    }
  }, [anio, online]);

  useEffect(() => {
    void load();
  }, [load]);

  return { meses, loadState, reload: load };
}
