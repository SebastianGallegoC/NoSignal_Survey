import { useCallback, useEffect, useState } from "react";

import { ACCESS_TOKEN_KEY } from "@/lib/authStorage";
import { fetchFormStatsAniosFromApi } from "@/services/api";

export type FormStatsAniosLoadState =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "offline"
  | "no_session";

export function useFormStatsAnios(online: boolean): {
  anios: number[];
  loadState: FormStatsAniosLoadState;
  reload: () => void;
} {
  const [anios, setAnios] = useState<number[]>([]);
  const [loadState, setLoadState] = useState<FormStatsAniosLoadState>("idle");

  const load = useCallback(async () => {
    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;

    if (!online) {
      setAnios([]);
      setLoadState("offline");
      return;
    }
    if (!token) {
      setAnios([]);
      setLoadState("no_session");
      return;
    }

    setLoadState("loading");
    try {
      const list = await fetchFormStatsAniosFromApi();
      setAnios(list.length > 0 ? list : [new Date().getFullYear()]);
      setLoadState("ready");
    } catch {
      setAnios([new Date().getFullYear()]);
      setLoadState("error");
    }
  }, [online]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onOnline = () => {
      if (online) {
        void load();
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [online, load]);

  return { anios, loadState, reload: load };
}
