"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStopsStore } from "@/lib/store";

type AuthMode = "login" | "signup";

export default function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const refreshSession = useStopsStore((state) => state.refreshSession);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error inesperado");
      }

      // Ensure store has the user session before redirecting
      await refreshSession();

      // Redirect on success
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al intentar autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-3xl font-bold text-center">
          {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
        </CardTitle>
        <CardDescription className="text-center text-lg">
          {mode === "login"
            ? "Ingresa tus datos para continuar"
            : "Regístrate para guardar tus rutas"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Correo Electrónico
            </label>
            <Input
              id="email"
              type="email"
              placeholder="mama@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 text-lg px-4"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 text-lg px-4"
              disabled={loading}
            />
          </div>

          <div className="flex items-center">
            <label className="relative flex items-center gap-3 cursor-pointer select-none min-h-[44px] group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer sr-only"
                disabled={loading}
              />
              <div className="h-7 w-7 rounded border-2 border-primary bg-background ring-offset-background transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center justify-center">
                {rememberMe && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-lg font-medium">Recordar datos</span>
            </label>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-lg font-medium animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-14 text-xl font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
            disabled={loading}
          >
            {loading
              ? "Cargando..."
              : mode === "login"
              ? "Entrar"
              : "Registrarse"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 pt-2">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground text-base">
              ¿O prefieres?
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          type="button"
          className="w-full h-14 text-lg"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          disabled={loading}
        >
          {mode === "login" ? "Crear una cuenta nueva" : "Ya tengo una cuenta"}
        </Button>
      </CardFooter>
    </Card>
  );
}
