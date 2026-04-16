"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStopsStore } from "@/lib/store";

type Status = "idle" | "locating" | "optimizing" | "success" | "error";

export default function OptimizeButton() {
  const stops = useStopsStore((s) => s.stops);
  const isOptimized = useStopsStore((s) => s.isOptimized);
  const homeLocation = useStopsStore((s) => s.homeLocation);
  const reorderStops = useStopsStore((s) => s.reorderStops);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const pendingStops = stops.filter((s) => s.status === "pending");
  const withCoords = pendingStops.filter((s) => s.lat !== null && s.lng !== null);
  const withoutCoords = pendingStops.filter((s) => s.lat === null || s.lng === null);

  const isWorking = status === "locating" || status === "optimizing";
  const canOptimize = withCoords.length >= 2 && !isWorking;

  async function handleOptimize() {
    setErrorMsg("");
    setStatus("locating");

    console.log("[Optimize] Iniciando optimización...");
    console.log("[Optimize] Paradas pendientes:", pendingStops.length);
    console.log("[Optimize] Con coordenadas:", withCoords.length);
    console.log("[Optimize] Sin coordenadas:", withoutCoords.length);
    console.log("[Optimize] Home configurado:", homeLocation ? homeLocation.address : "no");

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Su navegador no soporta geolocalización. Intente con otro navegador.");
      return;
    }

    let origin: [number, number];
    try {
      console.log("[Optimize] Solicitando GPS...");
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          });
        }
      );
      origin = [position.coords.longitude, position.coords.latitude];
      console.log("[Optimize] GPS obtenido:", { lat: position.coords.latitude, lng: position.coords.longitude });
    } catch (geoError) {
      setStatus("error");
      const err = geoError as GeolocationPositionError;
      if (err.code === err.PERMISSION_DENIED) {
        setErrorMsg("Permiso de ubicación denegado. Active el GPS y permita el acceso en su navegador.");
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setErrorMsg("No se pudo determinar su ubicación. Verifique que el GPS esté activado.");
      } else if (err.code === err.TIMEOUT) {
        setErrorMsg("Se agotó el tiempo buscando su ubicación. Intente en un lugar con mejor señal.");
      } else {
        setErrorMsg("No se pudo obtener su ubicación. Verifique GPS y permisos.");
      }
      console.error("[Optimize] Error GPS:", err.code, err.message);
      return;
    }

    setStatus("optimizing");
    try {
      const jobs = withCoords.map((stop) => ({
        id: stop.id,
        location: [stop.lng!, stop.lat!] as [number, number],
      }));

      // Construir body con end (home) si está configurado
      const body: Record<string, unknown> = { origin, jobs };
      if (homeLocation) {
        body.end = [homeLocation.lng, homeLocation.lat];
        console.log("[Optimize] Ruta circular hacia:", homeLocation.address);
      }

      console.log("[Optimize] Enviando a /api/optimize:", {
        origin,
        end: body.end ?? "sin home",
        jobCount: jobs.length,
      });

      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log("[Optimize] Respuesta:", response.status, data);

      if (!response.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Error al optimizar la ruta. Intente de nuevo.");
        return;
      }

      reorderStops(data.orderedIds);
      setStatus("success");
      console.log("[Optimize] Ruta optimizada con éxito. Orden:", data.orderedIds);

      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error("[Optimize] Error de conexión:", error);
      setStatus("error");
      setErrorMsg("Error de conexión. Verifique su internet e intente de nuevo.");
    }
  }

  if (pendingStops.length < 2) return null;

  // Texto y colores según estado
  let buttonLabel: string;
  let buttonColors: string;

  if (status === "locating") {
    buttonLabel = "Obteniendo ubicación...";
    buttonColors = "bg-green-600 hover:bg-green-700 text-white";
  } else if (status === "optimizing") {
    buttonLabel = "Calculando mejor ruta...";
    buttonColors = "bg-green-600 hover:bg-green-700 text-white";
  } else if (status === "success") {
    buttonLabel = "Ruta optimizada!";
    buttonColors = "bg-green-700 hover:bg-green-800 text-white";
  } else if (status === "error") {
    buttonLabel = "Reintentar Optimización";
    buttonColors = "bg-amber-600 hover:bg-amber-700 text-white";
  } else if (!isOptimized) {
    // idle + dirty
    buttonLabel = "Ruta Desactualizada — Reoptimizar";
    buttonColors = "bg-amber-500 hover:bg-amber-600 text-white";
  } else {
    // idle + optimized
    buttonLabel = "Optimizar Ruta";
    buttonColors = "bg-green-600 hover:bg-green-700 text-white";
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleOptimize}
        disabled={!canOptimize && status !== "error"}
        className={`h-14 text-lg font-bold rounded-xl disabled:opacity-50 ${buttonColors}`}
      >
        {isWorking && (
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {status === "success" && (
          <svg className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {buttonLabel}
      </Button>

      {homeLocation && status === "idle" && (
        <p className="text-base text-muted-foreground font-medium">
          Regreso a: {homeLocation.address}
        </p>
      )}

      {withoutCoords.length > 0 && (
        <p className="text-base text-amber-700 font-medium">
          {withoutCoords.length} parada{withoutCoords.length > 1 ? "s" : ""} sin
          ubicación exacta — se dejarán al final.
        </p>
      )}

      {withCoords.length < 2 && pendingStops.length >= 2 && (
        <p className="text-base text-amber-700 font-medium">
          Se necesitan al menos 2 paradas con coordenadas para optimizar.
        </p>
      )}

      {errorMsg && (
        <p className="text-base text-red-600 font-medium">{errorMsg}</p>
      )}
    </div>
  );
}
