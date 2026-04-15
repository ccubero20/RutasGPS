"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStopsStore } from "@/lib/store";
import type { Stop } from "@/lib/store";

function NotesField({ stop }: { stop: Stop }) {
  const updateStopNotes = useStopsStore((s) => s.updateStopNotes);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(stop.notas);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  function handleBlur() {
    const trimmed = draft.trim();
    if (trimmed !== stop.notas) {
      updateStopNotes(stop.id, trimmed);
    }
    setDraft(trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        placeholder="Nombre del cliente, teléfono, referencias, monto…"
        className="w-full min-h-[96px] rounded-xl border-2 border-input bg-background p-3 text-base resize-y focus:outline-none focus:ring-2 focus:ring-ring"
      />
    );
  }

  if (stop.notas) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
        <p className="flex-1 text-base text-amber-900 whitespace-pre-wrap break-words">
          {stop.notas}
        </p>
        <Button
          variant="outline"
          className="h-10 px-3 text-base rounded-lg flex-shrink-0"
          onClick={() => {
            setDraft(stop.notas);
            setEditing(true);
          }}
        >
          Editar
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className="h-12 text-base font-medium rounded-xl border-dashed"
      onClick={() => {
        setDraft("");
        setEditing(true);
      }}
    >
      + Agregar nota
    </Button>
  );
}

function buildWazeUrl(stop: Stop): string {
  if (stop.lat !== null && stop.lng !== null) {
    return `https://waze.com/ul?ll=${stop.lat},${stop.lng}&navigate=yes`;
  }
  return `https://waze.com/ul?q=${encodeURIComponent(stop.textoOriginal)}`;
}

function buildMapsUrl(stop: Stop): string {
  if (stop.lat !== null && stop.lng !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.textoOriginal)}`;
}

export default function RouteList() {
  const stops = useStopsStore((s) => s.stops);
  const removeStop = useStopsStore((s) => s.removeStop);
  const toggleCompleted = useStopsStore((s) => s.toggleCompleted);

  if (stops.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 text-lg">
        No hay paradas todavía.
        <br />
        Agregue direcciones arriba para comenzar.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">
        Paradas ({stops.length})
      </h2>
      {stops.map((stop, index) => (
        <Card
          key={stop.id}
          className={`border-2 ${stop.completado ? "opacity-60 border-green-500" : ""}`}
        >
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleCompleted(stop.id)}
                className={`mt-1 flex-shrink-0 w-7 h-7 rounded-md border-2 flex items-center justify-center transition-colors ${
                  stop.completado
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-muted-foreground"
                }`}
                aria-label={stop.completado ? "Marcar como pendiente" : "Marcar como completada"}
              >
                {stop.completado && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <p className={`text-lg font-medium break-words ${stop.completado ? "line-through text-muted-foreground" : ""}`}>
                <span className="text-muted-foreground mr-2">{index + 1}.</span>
                {stop.textoOriginal}
              </p>
            </div>
            {stop.lat !== null && stop.lng !== null && (
              <p className="text-base text-muted-foreground">
                Coordenadas: {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
              </p>
            )}
            <NotesField stop={stop} />
            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex-1 h-14 text-base font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => window.open(buildWazeUrl(stop), "_blank")}
              >
                Ir con Waze
              </Button>
              <Button
                variant="default"
                className="flex-1 h-14 text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.open(buildMapsUrl(stop), "_blank")}
              >
                Ir con Maps
              </Button>
            </div>
            <Button
              variant="destructive"
              className="h-12 text-base font-semibold rounded-xl"
              onClick={() => removeStop(stop.id)}
            >
              Eliminar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
