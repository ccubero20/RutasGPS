"use client";

import { useStopsStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Header component that displays the application title, navigation, and a logout button.
 * The navigation and logout button are only visible when a user is authenticated.
 */
export default function Header() {
  const userId = useStopsStore((state) => state.userId);
  const reset = useStopsStore((state) => state.reset);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Reset the local store state
      reset();
      
      // Force refresh and redirect to login
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-primary text-primary-foreground shadow-md">
      <div className="w-full max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between py-3 gap-4">
          <h1 className="text-xl font-bold leading-tight truncate">
            Rutas CR
          </h1>
          
          {userId && (
            <Button
              variant="secondary"
              size="sm"
              className="h-10 px-3 text-sm font-bold flex items-center gap-2 transition-transform active:scale-95"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span>Salir</span>
            </Button>
          )}
        </div>

        {userId && (
          <nav className="grid grid-cols-2 gap-2 pb-3">
            <Button
              variant={pathname === "/" ? "secondary" : "ghost"}
              className={`h-14 text-lg font-bold shadow-sm ${
                pathname === "/" ? "ring-2 ring-white/20" : "bg-white/10"
              }`}
              onClick={() => router.push("/")}
            >
              Ruta Actual
            </Button>
            <Button
              variant={pathname === "/historial" ? "secondary" : "ghost"}
              className={`h-14 text-lg font-bold shadow-sm ${
                pathname === "/historial" ? "ring-2 ring-white/20" : "bg-white/10"
              }`}
              onClick={() => router.push("/historial")}
            >
              Historial
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
