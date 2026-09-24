"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LocalSessionRecord } from "@/lib/types";
import { getSessionById } from "@/lib/syncQueue";
import SessionResults from "@/components/SessionResults";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<LocalSessionRecord | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getSessionById(params.id).then((record) => {
      if (active) setSession(record);
    });
    return () => {
      active = false;
    };
  }, [params.id]);

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <Link href="/historial" className="flex items-center gap-1 text-sm text-foreground-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Historial
      </Link>

      {session === undefined && (
        <p className="py-8 text-center text-sm text-foreground-muted">Cargando…</p>
      )}

      {session === null && (
        <p className="py-8 text-center text-sm text-foreground-muted">
          No se encontró esa sesión.
        </p>
      )}

      {session && (
        <SessionResults
          fecha={session.fecha}
          disparos={session.disparos}
          moscas={session.moscas}
          syncStatus={session.status}
        />
      )}
    </div>
  );
}
