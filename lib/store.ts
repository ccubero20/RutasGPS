import { create } from "zustand";
import { persist } from "zustand/middleware";
import { parseCoordinates } from "./parsers";
import { createClient } from "./supabase/client";

export type StopStatus = "pending" | "delivered" | "failed";

export interface Stop {
  id: string;
  textoOriginal: string;
  lat: number | null;
  lng: number | null;
  status: StopStatus;
  notes: string;
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
  userId: string | null;
  setUserId: (userId: string | null) => void;
  addStop: (texto: string) => Promise<void>;
  addStopWithCoords: (texto: string, lat: number, lng: number) => Promise<void>;
  removeStop: (id: string) => Promise<void>;
  updateStopStatus: (id: string, status: StopStatus) => Promise<void>;
  reorderStops: (orderedIds: string[]) => Promise<void>;
  updateStopNotes: (id: string, notes: string) => Promise<void>;
  setHomeLocation: (address: string, lat: number, lng: number) => Promise<void>;
  clearHomeLocation: () => Promise<void>;
  clearAll: () => Promise<void>;
  reset: () => void;
  refreshSession: () => Promise<void>;
  uploadToSupabase: () => Promise<void>;
  downloadFromSupabase: () => Promise<void>;
}

const supabase = createClient();

export const useStopsStore = create<StopsState>()(
  persist(
    (set, get) => ({
      stops: [],
      homeLocation: null,
      isOptimized: false,
      userId: null,

      setUserId: (userId: string | null) => {
        set({ userId });
      },

      refreshSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          set({ userId: session.user.id });
        }
      },

      addStop: async (texto: string) => {
        const coords = parseCoordinates(texto);
        const stop: Stop = {
          id: crypto.randomUUID(),
          textoOriginal: texto,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          status: "pending",
          notes: "",
        };
        set((state) => ({ stops: [...state.stops, stop], isOptimized: false }));

        const { userId } = get();
        if (userId) {
          await supabase.from("stops").insert({
            id: stop.id,
            user_id: userId,
            address: stop.textoOriginal,
            name: stop.textoOriginal,
            coordinates: { lat: stop.lat, lng: stop.lng },
            notes: stop.notes,
            status: stop.status,
            order_index: get().stops.length - 1,
          });
        }
      },

      addStopWithCoords: async (texto: string, lat: number, lng: number) => {
        const stop: Stop = {
          id: crypto.randomUUID(),
          textoOriginal: texto,
          lat,
          lng,
          status: "pending",
          notes: "",
        };
        set((state) => ({ stops: [...state.stops, stop], isOptimized: false }));

        const { userId } = get();
        if (userId) {
          await supabase.from("stops").insert({
            id: stop.id,
            user_id: userId,
            address: stop.textoOriginal,
            name: stop.textoOriginal,
            coordinates: { lat, lng },
            notes: stop.notes,
            status: stop.status,
            order_index: get().stops.length - 1,
          });
        }
      },

      removeStop: async (id: string) => {
        set((state) => ({
          stops: state.stops.filter((s) => s.id !== id),
          isOptimized: false,
        }));

        const { userId } = get();
        if (userId) {
          await supabase.from("stops").delete().match({ id, user_id: userId });
        }
      },

      updateStopStatus: async (id: string, status: StopStatus) => {
        set((state) => ({
          stops: state.stops.map((s) =>
            s.id === id ? { ...s, status } : s
          ),
          isOptimized: false,
        }));

        const { userId } = get();
        if (userId) {
          const { error } = await supabase
            .from("stops")
            .update({ status })
            .match({ id, user_id: userId });
          
          if (error) {
            console.error("Error updating stop status in Supabase:", error);
          }
        }
      },

      reorderStops: async (orderedIds: string[]) => {
        set((state) => {
          const idOrder = new Map(orderedIds.map((id, i) => [id, i]));
          
          // Clasificar paradas
          const finished = state.stops.filter(s => s.status !== "pending");
          const pending = state.stops.filter(s => s.status === "pending");
          
          // Dentro de pendientes, separar optimizadas de no optimizadas
          const optimized = pending
            .filter(s => idOrder.has(s.id))
            .sort((a, b) => (idOrder.get(a.id)!) - (idOrder.get(b.id)!));
            
          const remaining = pending.filter(s => !idOrder.has(s.id));

          // El nuevo orden es: Finalizadas primero, luego Optimizadas, luego Resto
          const ordered = [...finished, ...optimized, ...remaining];
          
          return { stops: ordered, isOptimized: true };
        });

        const { userId, stops } = get();
        if (userId) {
          // Update all stops order_index
          const updates = stops.map((stop, index) => ({
            id: stop.id,
            user_id: userId,
            order_index: index,
            address: stop.textoOriginal,
            name: stop.textoOriginal,
            coordinates: { lat: stop.lat, lng: stop.lng },
            notes: stop.notes,
            status: stop.status,
          }));
          const { error } = await supabase.from("stops").upsert(updates);
          if (error) {
            console.error("Error upserting stops order in Supabase:", error);
          }
        }
      },

      updateStopNotes: async (id: string, notes: string) => {
        set((state) => ({
          stops: state.stops.map((s) =>
            s.id === id ? { ...s, notes } : s
          ),
        }));

        const { userId } = get();
        if (userId) {
          const { error } = await supabase
            .from("stops")
            .update({ notes })
            .match({ id, user_id: userId });
          
          if (error) {
            console.error("Error updating stop notes in Supabase:", error);
          }
        }
      },

      setHomeLocation: async (address: string, lat: number, lng: number) => {
        set({ homeLocation: { address, lat, lng } });

        const { userId } = get();
        if (userId) {
          await supabase
            .from("profiles")
            .update({ home_location: { address, lat, lng } })
            .match({ id: userId });
        }
      },

      clearHomeLocation: async () => {
        set({ homeLocation: null });

        const { userId } = get();
        if (userId) {
          await supabase
            .from("profiles")
            .update({ home_location: null })
            .match({ id: userId });
        }
      },

      clearAll: async () => {
        const { userId, stops } = get();
        set({ stops: [], isOptimized: false });

        if (userId && stops.length > 0) {
          await supabase.from("stops").delete().match({ user_id: userId });
        }
      },

      reset: () => {
        set({ stops: [], homeLocation: null, isOptimized: false, userId: null });
      },

      uploadToSupabase: async () => {
        const { userId, stops, homeLocation } = get();
        if (!userId) return;

        if (stops.length > 0) {
          const updates = stops.map((stop, index) => ({
            id: stop.id,
            user_id: userId,
            address: stop.textoOriginal,
            name: stop.textoOriginal,
            coordinates: { lat: stop.lat, lng: stop.lng },
            notes: stop.notes,
            status: stop.status,
            order_index: index,
          }));
          await supabase.from("stops").upsert(updates);
        }

        if (homeLocation) {
          await supabase
            .from("profiles")
            .update({ home_location: homeLocation })
            .match({ id: userId });
        }
      },

      downloadFromSupabase: async () => {
        const { userId } = get();
        if (!userId) return;

        // Download stops
        const { data: stopsData, error: stopsError } = await supabase
          .from("stops")
          .select("*")
          .order("order_index", { ascending: true });

        if (!stopsError && stopsData) {
          const stops: Stop[] = stopsData.map((s) => ({
            id: s.id,
            textoOriginal: s.name || s.address,
            lat: s.coordinates?.lat ?? null,
            lng: s.coordinates?.lng ?? null,
            status: (s.status as StopStatus) || "pending",
            notes: s.notes || "",
          }));
          set({ stops });
        }

        // Download profile (home_location)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("home_location")
          .eq("id", userId)
          .single();

        if (!profileError && profileData) {
          set({ homeLocation: profileData.home_location as HomeLocation | null });
        }
      },
    }),
    {
      name: "rutas-stops",
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as any;
        if (version < 2 && state?.stops) {
          state.stops = state.stops.map((s: any) => ({
            ...s,
            notas: typeof s.notas === "string" ? s.notas : "",
          }));
        }
        if (version < 3 && state?.stops) {
          state.stops = state.stops.map((s: any) => ({
            ...s,
            status: s.status || (s.completado ? "delivered" : "pending"),
            notes: s.notes || s.notas || "",
          }));
        }
        return state as unknown as StopsState;
      },
    }
  )
);
