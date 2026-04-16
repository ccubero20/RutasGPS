"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStopsStore } from "@/lib/store";
import type { Stop, StopStatus } from "@/lib/store";
import { ChevronDown, ChevronUp, Trash2, MapPin, MessageSquareText } from "lucide-react";

function StatusSelector({ stop }: { stop: Stop }) {
  const updateStopStatus = useStopsStore((s) => s.updateStopStatus);

  const statuses: { value: StopStatus; label: string; activeClass: string }[] = [
    { 
      value: "pending", 
      label: "Pendiente", 
      activeClass: "bg-slate-200 text-slate-700 border-slate-400 shadow-inner" 
    },
    { 
      value: "delivered", 
      label: "Entregado", 
      activeClass: "bg-green-600 text-white border-green-700 shadow-md scale-[1.02]" 
    },
    { 
      value: "failed", 
      label: "Rechazado", 
      activeClass: "bg-red-600 text-white border-red-700 shadow-md scale-[1.02]" 
    },
  ];

  return (
    <div className="flex flex-col gap-2 mt-2">
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">Estado de Entrega:</p>
      <div className="grid grid-cols-3 gap-2">
        {statuses.map((status) => {
          const isActive = stop.status === status.value;
          return (
            <button
              key={status.value}
              type="button"
              onClick={() => updateStopStatus(stop.id, status.value)}
              className={`h-14 text-lg font-bold rounded-xl border-2 transition-all active:scale-95 flex items-center justify-center ${
                isActive 
                  ? status.activeClass 
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
              }`}
            >
              {status.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NotesField({ stop }: { stop: Stop }) {
  const updateStopNotes = useStopsStore((s) => s.updateStopNotes);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(stop.notes);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isOpen]);

  // Sync draft if store changes (e.g. from sync)
  useEffect(() => {
    if (!isOpen) {
      setDraft(stop.notes);
    }
  }, [stop.notes, isOpen]);

  function handleSave() {
    const trimmed = draft.trim();
    updateStopNotes(stop.id, trimmed);
    setIsOpen(false);
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      <Button
        variant="ghost"
        className={`h-14 w-full flex justify-between px-4 rounded-xl border-2 transition-colors ${
          stop.notes 
            ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 hover:border-amber-300" 
            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-bold text-base">
          <MessageSquareText className="w-5 h-5" />
          {stop.notes ? "Ver/Editar Notas" : "Agregar Notas"}
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </Button>

      {isOpen && (
        <div className="flex flex-col gap-3 p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm mt-1">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ej: Portón negro, llamar al llegar, cliente paga con Sinpe, dejar en recepción…"
            className="w-full min-h-[140px] rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-lg focus:border-sky-500 focus:bg-white focus:outline-none transition-all"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-14 text-lg font-bold rounded-xl border-2 border-slate-200"
              onClick={() => {
                setDraft(stop.notes);
                setIsOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="h-14 text-lg font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
              onClick={handleSave}
            >
              Guardar Nota
            </Button>
          </div>
        </div>
      )}
      
      {!isOpen && stop.notes && (
        <div className="px-2 py-1">
          <p className="text-base text-slate-600 line-clamp-2 italic leading-tight">
            "{stop.notes}"
          </p>
        </div>
      )}
    </div>
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
  const [showCompleted, setShowCompleted] = useState(false);

  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-slate-400 py-16 px-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
        <MapPin className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-xl font-medium">No hay paradas todavía.</p>
        <p className="text-lg">Agregue direcciones arriba para comenzar su ruta.</p>
      </div>
    );
  }

  const pendingStops = stops.filter((s) => s.status === "pending");
  const completedStops = stops.filter((s) => s.status !== "pending");

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          Pendientes 
          <span className="bg-slate-200 text-slate-600 text-sm py-1 px-3 rounded-full font-bold">
            {pendingStops.length}
          </span>
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {pendingStops.map((stop, index) => (
          <StopCard 
            key={stop.id} 
            stop={stop} 
            index={index} 
            removeStop={removeStop} 
          />
        ))}

        {pendingStops.length === 0 && completedStops.length > 0 && (
          <div className="text-center py-8 px-4 bg-green-50 rounded-3xl border-2 border-dashed border-green-200">
            <p className="text-xl font-bold text-green-700">¡Todo entregado! 🎉</p>
            <p className="text-lg text-green-600">No quedan paradas pendientes.</p>
          </div>
        )}

        {completedStops.length > 0 && (
          <div className="mt-4 flex flex-col gap-4">
            <Button
              variant="outline"
              className="h-14 text-lg font-bold rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-600 flex justify-between px-6"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <span>{showCompleted ? "Ocultar completadas" : `Ver completadas (${completedStops.length})`}</span>
              {showCompleted ? <ChevronUp /> : <ChevronDown />}
            </Button>

            {showCompleted && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {completedStops.map((stop, index) => (
                  <StopCard 
                    key={stop.id} 
                    stop={stop} 
                    index={pendingStops.length + index} 
                    removeStop={removeStop} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StopCard({ stop, index, removeStop }: { stop: Stop; index: number; removeStop: (id: string) => void }) {
  const isDelivered = stop.status === "delivered";
  const isFailed = stop.status === "failed";

  return (
    <Card
      className={`overflow-hidden border-2 transition-all duration-300 shadow-sm ${
        isDelivered 
          ? "border-green-200 bg-green-50/30 opacity-80" 
          : isFailed
          ? "border-red-200 bg-red-50/30 opacity-90"
          : "border-slate-200 bg-white"
      }`}
    >
      <CardContent className="flex flex-col gap-4 p-5">
        {/* Header: Number and Address */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl font-black transition-colors ${
            isDelivered ? "bg-green-600 text-white" : 
            isFailed ? "bg-red-600 text-white" : 
            "bg-slate-800 text-white"
          }`}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xl font-bold leading-tight break-words ${isDelivered ? "line-through text-slate-500" : "text-slate-800"}`}>
              {stop.textoOriginal}
            </p>
            {stop.lat !== null && stop.lng !== null && (
              <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-tighter">
                Ubicación confirmada ✓
              </p>
            )}
          </div>
        </div>

        {/* Status Selector */}
        <StatusSelector stop={stop} />

        {/* Notes Block */}
        <NotesField stop={stop} />

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="default"
            className="flex-1 h-16 text-lg font-black rounded-2xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white shadow-md active:shadow-inner flex gap-2"
            onClick={() => window.open(buildWazeUrl(stop), "_blank")}
          >
            <span>WAZE</span>
          </Button>
          <Button
            variant="default"
            className="flex-1 h-16 text-lg font-black rounded-2xl bg-[#34A853] hover:bg-[#2c8f46] active:bg-[#257a3c] text-white shadow-md active:shadow-inner"
            onClick={() => window.open(buildMapsUrl(stop), "_blank")}
          >
            MAPS
          </Button>
        </div>

        {/* Delete Button */}
        <Button
          variant="ghost"
          className="h-12 text-base font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl mt-1 flex gap-2 items-center justify-center border-2 border-transparent hover:border-red-100 transition-all"
          onClick={() => {
            if (confirm("¿Seguro que desea eliminar esta parada?")) {
              removeStop(stop.id);
            }
          }}
        >
          <Trash2 className="w-5 h-5" />
          Eliminar parada
        </Button>
      </CardContent>
    </Card>
  );
}
