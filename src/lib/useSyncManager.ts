"use client";

import { useCallback, useEffect, useState } from "react";
import { getPendingCount, syncPendingSessions } from "./syncQueue";

// Dispara la sincronización con Supabase al reconectar, al volver a foco la
// app, y en un intervalo de respaldo (por si el evento `online` no llega
// a tiempo, algo común en navegadores móviles).
export function useSyncManager() {
  const [pendingCount, setPendingCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    setPendingCount(await getPendingCount());
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      await syncPendingSessions({ force: true });
      await refreshCount();
    } finally {
      setSyncing(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- navigator.onLine is only known client-side, after hydration
    setOnline(navigator.onLine);
    refreshCount();

    const trigger = async () => {
      await syncPendingSessions();
      await refreshCount();
    };

    const handleOnline = () => {
      setOnline(true);
      trigger();
    };
    const handleOffline = () => setOnline(false);
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) trigger();
    };
    const handleChanged = () => refreshCount();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("minirifle-sync-changed", handleChanged);

    trigger();

    const interval = setInterval(() => {
      if (navigator.onLine) trigger();
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("minirifle-sync-changed", handleChanged);
      clearInterval(interval);
    };
  }, [refreshCount]);

  return { pendingCount, online, syncing, syncNow };
}
