"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayHistory } from "@/lib/supabase/history";
import { 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HistoryCardProps {
  history: DayHistory;
}

/**
 * Component to display a daily summary of route performance.
 * Follows "Mom-Friendly" standards: high legibility, large numbers, clear colors.
 * Now includes an expandable section for stop details.
 */
export default function HistoryCard({ history }: HistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Formats a date string into a human-readable format.
   * Ensures comparisons are done in America/Costa_Rica timezone.
   */
  const formatDate = (dateStr: string) => {
    const crFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Costa_Rica",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const todayStr = crFormatter.format(new Date());
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = crFormatter.format(yesterdayDate);

    if (dateStr === todayStr) return "Hoy";
    if (dateStr === yesterdayStr) return "Ayer";

    // Format for long display
    const date = new Date(`${dateStr}T12:00:00`);
    return new Intl.DateTimeFormat("es-CR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "America/Costa_Rica"
    })
      .format(date)
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  /**
   * Formats time from ISO string explicitly for Costa Rica timezone.
   */
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("es-CR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Costa_Rica"
    });
  };

  return (
    <Card className={cn(
      "overflow-hidden border-2 shadow-md transition-all duration-200",
      isExpanded ? "ring-2 ring-primary/20" : "hover:border-primary/30"
    )}>
      <CardHeader className="bg-muted/30 border-b pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl font-black text-foreground">
          {formatDate(history.date)}
        </CardTitle>
        <div className="bg-white/80 px-3 py-1 rounded-full border text-xs font-bold text-muted-foreground flex items-center gap-1.5 shadow-sm">
          <Clock size={14} />
          {history.stops.length} paradas
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-0 px-0">
        <div className="grid grid-cols-3 gap-2 px-6 mb-6">
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Total
            </span>
            <span className="text-4xl font-black text-slate-700 tabular-nums">
              {history.total}
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center border-x px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-green-700 mb-1">
              Listos
            </span>
            <span className="text-4xl font-black text-green-600 tabular-nums">
              {history.delivered}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">
              Falla
            </span>
            <span className="text-4xl font-black text-red-600 tabular-nums">
              {history.failed}
            </span>
          </div>
        </div>

        {/* Botón de Expansión "Mom-Friendly" */}
        <Button 
          variant="ghost" 
          className={cn(
            "w-full h-14 text-lg font-black flex gap-2 rounded-none border-t border-b bg-slate-50 hover:bg-slate-100",
            isExpanded && "bg-primary/5 text-primary border-primary/20"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>Ocultar detalle <ChevronUp className="h-6 w-6" /></>
          ) : (
            <>Ver todas las paradas <ChevronDown className="h-6 w-6" /></>
          )}
        </Button>

        {/* Sección Expandible */}
        {isExpanded && (
          <div className="bg-slate-50/50 p-4 space-y-3">
            {history.stops.map((stop) => (
              <div 
                key={stop.id} 
                className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border-2 shadow-sm"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1 flex-shrink-0">
                    <MapPin size={20} className="text-slate-400" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-lg font-bold text-slate-800 leading-tight">
                      {stop.textoOriginal}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-muted-foreground bg-slate-100 px-2 py-0.5 rounded">
                        {formatTime(stop.created_at)}
                      </span>
                      {stop.notes && (
                        <span className="text-xs text-muted-foreground italic truncate">
                          • {stop.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  {stop.status === "delivered" ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-xl border-2 border-green-200">
                      <CheckCircle2 size={18} />
                      <span className="text-xs font-black uppercase">Listos</span>
                    </div>
                  ) : stop.status === "failed" ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-xl border-2 border-red-200">
                      <XCircle size={18} />
                      <span className="text-xs font-black uppercase">Falla</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl border-2 border-slate-200">
                      <Clock size={18} />
                      <span className="text-xs font-black uppercase">Pendiente</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Espaciado inferior si no está expandido para que se vea bien el borde */}
        {!isExpanded && <div className="h-2" />}
      </CardContent>
    </Card>
  );
}
