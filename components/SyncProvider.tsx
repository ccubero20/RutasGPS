"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStopsStore } from "@/lib/store";

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { 
    setUserId, 
    userId, 
    uploadToSupabase, 
    downloadFromSupabase, 
    clearAll,
    reset,
    stops 
  } = useStopsStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const newUserId = session.user.id;
          
          if (newUserId !== userId) {
            setUserId(newUserId);
            
            // Sync logic
            // If we have local stops, we should probably upload them to the new user account
            // but if the user just logged in, maybe they want what's already in the cloud.
            // DoD says: "Al iniciar sesión, las paradas del localStorage se suben a Supabase"
            if (stops.length > 0) {
              await uploadToSupabase();
            } else {
              await downloadFromSupabase();
            }
          }
        } else {
          if (userId) {
            // Logout event
            reset();
            // DoD says: "Al cerrar sesión, el localStorage se limpia" (default)
            localStorage.removeItem("rutas-stops");
          }
        }
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        // If we are already logged in on mount, maybe we should download?
        // Or if there are local stops, upload? 
        // For now, let's just download if the store is empty.
        if (useStopsStore.getState().stops.length === 0) {
           downloadFromSupabase();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUserId, userId, uploadToSupabase, downloadFromSupabase, clearAll, stops.length, supabase.auth]);

  return <>{children}</>;
}
