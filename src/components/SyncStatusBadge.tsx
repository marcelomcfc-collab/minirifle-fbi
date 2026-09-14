"use client";

import { useSyncManager } from "@/lib/useSyncManager";

export default function SyncStatusBadge() {
  const { pendingCount, online, syncing, syncNow } = useSyncManager();

  if (online && pendingCount === 0) return null;

  return (
    <div className="ml-auto flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-medium text-foreground-muted">
      {!online && <OfflineDot />}
      <span>{!online ? "Sin conexión" : "Sincronizando…"}</span>
      {pendingCount > 0 && (
        <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-accent">
          {pendingCount} pend.
        </span>
      )}
      {pendingCount > 0 && (
        <button
          onClick={syncNow}
          disabled={syncing}
          className="rounded-full border border-accent/50 px-2 py-0.5 text-accent disabled:opacity-50"
        >
          {syncing ? "…" : "Sincronizar ahora"}
        </button>
      )}
    </div>
  );
}

function OfflineDot() {
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />;
}
