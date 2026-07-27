"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Pause, Play, X } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCourierTracking } from "@/hooks/useCourierTracking";

export default function CourierLocationSharing() {
  const { profile } = useAuth() as any;
  const courierId =
    profile?.courierId || (profile?.role === "Admin" ? profile?.uid : "");
  const {
    trackingStatus,
    lastLocation,
    errorMsg,
    startTracking,
    pauseTracking,
    resumeTracking,
  } = useCourierTracking(courierId);
  const [showConsent, setShowConsent] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!courierId) return;
    const choice = sessionStorage.getItem(`enkargord-location-consent:${courierId}`);
    if (choice === "allowed") {
      void startTracking();
    } else if (!choice) {
      setShowConsent(true);
    }
    // The prompt is intentionally evaluated once per courier session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courierId]);

  const acceptSharing = async () => {
    if (!courierId || requesting) return;
    setRequesting(true);
    sessionStorage.setItem(`enkargord-location-consent:${courierId}`, "allowed");
    try {
      await startTracking();
      setShowConsent(false);
    } finally {
      setRequesting(false);
    }
  };

  const declineSharing = () => {
    if (courierId) {
      sessionStorage.setItem(`enkargord-location-consent:${courierId}`, "declined");
    }
    setShowConsent(false);
  };

  if (!courierId) return null;

  return (
    <>
      {showConsent && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
            <button
              type="button"
              onClick={declineSharing}
              aria-label="Cerrar solicitud de ubicación"
              className="ml-auto flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#d3121a]">
              <MapPin size={30} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              ¿Quieres compartir tu ubicación?
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">
              Mientras estés repartiendo, el administrador y las tiendas con pedidos asignados podrán ver tu posición en vivo.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={declineSharing}
                className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-extrabold text-slate-600"
              >
                Ahora no
              </button>
              <button
                type="button"
                disabled={requesting}
                onClick={() => void acceptSharing()}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#d3121a] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-60"
              >
                {requesting ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
                Compartir
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-[9000] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              trackingStatus === "active"
                ? "animate-pulse bg-emerald-500"
                : trackingStatus === "paused"
                  ? "bg-amber-500"
                  : "bg-slate-300"
            }`}
          />
          <div>
            <p className="text-[11px] font-extrabold text-slate-800">
              {trackingStatus === "active"
                ? "Ubicación en vivo"
                : trackingStatus === "paused"
                  ? "Ubicación pausada"
                  : "Ubicación desactivada"}
            </p>
            <p className="text-[9px] text-slate-400">
              {lastLocation
                ? `Actualizada ${new Date(lastLocation.updatedAt).toLocaleTimeString("es-DO")}`
                : errorMsg || "Activa el GPS para compartir"}
            </p>
          </div>
          {trackingStatus === "active" ? (
            <button type="button" onClick={() => void pauseTracking()} aria-label="Pausar ubicación" className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <Pause size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void (trackingStatus === "paused" ? resumeTracking() : acceptSharing())}
              aria-label="Compartir ubicación"
              className="rounded-lg bg-emerald-50 p-2 text-emerald-700"
            >
              <Play size={14} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
