"use client";

import { useState } from "react";
import { useHistory } from "@/hooks/useHistory";
import HistoryCard from "@/components/HistoryCard";
import { RefreshCcw, History as HistoryIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Historial page that displays grouped stop history with date filtering.
 * Uses the useHistory hook for data fetching and performance metrics.
 * Follows "Mom-Friendly" standards: large inputs, clear labels, and high contrast.
 */
export default function HistorialPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filterDates, setFilterDates] = useState<{ start?: Date; end?: Date }>({});

  const { data, loading, error, refresh } = useHistory(filterDates.start, filterDates.end);

  const handleFilter = () => {
    // Usamos T00:00:00 y T23:59:59 para asegurar que se tome el día completo en zona horaria local
    const start = desde ? new Date(`${desde}T00:00:00`) : undefined;
    const end = hasta ? new Date(`${hasta}T23:59:59`) : undefined;
    setFilterDates({ start, end });
  };

  const renderContent = () => {
    if (loading && data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RefreshCcw className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-bold">Buscando historial...</h2>
          <p className="text-muted-foreground mt-2">Esto tomará solo un momento.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="bg-destructive/10 text-destructive p-6 rounded-2xl mb-4 w-full border-2 border-destructive/20">
            <h2 className="text-xl font-bold mb-2">¡Ups! Algo salió mal</h2>
            <p className="text-sm opacity-90">{error}</p>
          </div>
          <Button 
            onClick={() => refresh()} 
            className="h-14 w-full max-w-xs text-lg font-bold"
          >
            Intentar de nuevo
          </Button>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="bg-muted h-24 w-24 rounded-full flex items-center justify-center mb-6">
            <HistoryIcon size={48} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-black">No hay resultados</h2>
          <p className="text-muted-foreground mt-2 max-w-xs">
            Intenta ajustando el rango de fechas para encontrar tus paradas.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/"}
            className="h-14 w-full max-w-xs text-lg font-bold mt-8"
          >
            Ir a Ruta Actual
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {data.map((day) => (
          <HistoryCard key={day.date} history={day} />
        ))}
      </div>
    );
  };

  return (
    <div className="pb-10">
      <header className="mb-6">
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Historial
        </h2>
        <p className="text-muted-foreground font-medium">
          Revisa el detalle de tus rutas anteriores
        </p>
      </header>

      {/* Filtros "Mom-Friendly" */}
      <section className="bg-muted/30 p-4 rounded-2xl border-2 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="desde" className="text-base font-bold text-slate-700 ml-1">
              Desde
            </label>
            <Input 
              id="desde"
              type="date" 
              className="h-14 text-lg bg-white" 
              value={desde} 
              onChange={(e) => setDesde(e.target.value)} 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="hasta" className="text-base font-bold text-slate-700 ml-1">
              Hasta
            </label>
            <Input 
              id="hasta"
              type="date" 
              className="h-14 text-lg bg-white" 
              value={hasta} 
              onChange={(e) => setHasta(e.target.value)} 
            />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button 
              onClick={handleFilter} 
              className="h-14 w-full text-lg font-black shadow-md flex gap-2"
              disabled={loading}
            >
              {loading ? (
                <RefreshCcw className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Filter className="h-6 w-6" />
                  Filtrar Rutas
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {renderContent()}

      <div className="mt-12 pt-6 border-t text-center">
        <p className="text-sm text-muted-foreground italic">
          Mostrando únicamente paradas completadas o fallidas.
        </p>
      </div>
    </div>
  );
}
