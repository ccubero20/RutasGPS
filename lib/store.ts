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

interface StopsState {
  stops: Stop[];
  addStop: (texto: string) => void;
  removeStop: (id: string) => void;
  toggleCompleted: (id: string) => void;
  clearAll: () => void;
}

export const useStopsStore = create<StopsState>()(
  persist(
    (set) => ({
      stops: [],

      addStop: (texto: string) => {
        const coords = parseCoordinates(texto);
        const stop: Stop = {
          id: crypto.randomUUID(),
          textoOriginal: texto,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          completado: false,
        };
        set((state) => ({ stops: [...state.stops, stop] }));
      },

      removeStop: (id: string) => {
        set((state) => ({ stops: state.stops.filter((s) => s.id !== id) }));
      },

      toggleCompleted: (id: string) => {
        set((state) => ({
          stops: state.stops.map((s) =>
            s.id === id ? { ...s, completado: !s.completado } : s
          ),
        }));
      },

      clearAll: () => set({ stops: [] }),
    }),
    {
      name: "rutas-stops",
    }
  )
);
