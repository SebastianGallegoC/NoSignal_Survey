import { useEffect } from "react";

import { useAuthStore } from "@/store/useAuthStore";

export function useSessionRoleSync(enabled: boolean): void {
  const refreshSessionFromServer = useAuthStore((state) => state.refreshSessionFromServer);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refreshSessionFromServer();

    const onOnline = () => {
      void refreshSessionFromServer();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void refreshSessionFromServer();
      }
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, refreshSessionFromServer]);
}
