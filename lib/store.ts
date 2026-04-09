import { create } from "zustand";
import { persist } from "zustand/middleware";
import { parseCoordinates } from "./parsers";

export interface Stop {
  id: string;
  textoOriginal: string;
  lat: number | null;
  lng: number | null;
  completado: boolean;
}

export interface HomeLocation {
  address: string;
  lat: number;
  lng: number;
}

interface StopsState {
  stops: Stop[];
  homeLocation: HomeLocation | null;
  isOptimized: boolean;
  addStop: (texto: string) => void;
  addStopWithCoords: (texto: string, lat: number, lng: number) => void;
  removeStop: (id: string) => void;
  toggleCompleted: (id: string) => void;
  reorderStops: (orderedIds: string[]) => void;
  setHomeLocation: (address: string, lat: number, lng: number) => void;
  clearHomeLocation: () => void;
  clearAll: () => void;
}

export const useStopsStore = create<StopsState>()(
  persist(
    (set) => ({
      stops: [],
      homeLocation: null,
      isOptimized: false,

      addStop: (texto: string) => {
        const coords = parseCoordinates(texto);
        const stop: Stop = {
          id: crypto.randomUUID(),
          textoOriginal: texto,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          completado: false,
        };
        set((state) => ({ stops: [...state.stops, stop], isOptimized: false }));
      },

      addStopWithCoords: (texto: string, lat: number, lng: number) => {
        const stop: Stop = {
          id: crypto.randomUUID(),
          textoOriginal: texto,
          lat,
          lng,
          completado: false,
        };
        set((state) => ({ stops: [...state.stops, stop], isOptimized: false }));
      },

      removeStop: (id: string) => {
        set((state) => ({
          stops: state.stops.filter((s) => s.id !== id),
          isOptimized: false,
        }));
      },

      toggleCompleted: (id: string) => {
        set((state) => ({
          stops: state.stops.map((s) =>
            s.id === id ? { ...s, completado: !s.completado } : s
          ),
          isOptimized: false,
        }));
      },

      reorderStops: (orderedIds: string[]) => {
        set((state) => {
          const idOrder = new Map(orderedIds.map((id, i) => [id, i]));
          const ordered = [...state.stops].sort((a, b) => {
            const aIdx = idOrder.get(a.id);
            const bIdx = idOrder.get(b.id);
            if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
            if (aIdx !== undefined) return -1;
            if (bIdx !== undefined) return 1;
            return 0;
          });
          return { stops: ordered, isOptimized: true };
        });
      },

      setHomeLocation: (address: string, lat: number, lng: number) => {
        set({ homeLocation: { address, lat, lng } });
      },

      clearHomeLocation: () => {
        set({ homeLocation: null });
      },

      clearAll: () => set({ stops: [], isOptimized: false }),
    }),
    {
      name: "rutas-stops",
    }
  )
);
