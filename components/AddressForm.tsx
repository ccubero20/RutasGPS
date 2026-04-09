"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStopsStore } from "@/lib/store";
import { parseCoordinates, isUrl, cleanInput } from "@/lib/parsers";

interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `/api/reverse-geocode?lat=${lat}&lng=${lng}`
    );
    const data = await res.json();
    return data.label || "Dirección de enlace";
  } catch {
    return "Dirección de enlace";
  }
}

export default function AddressForm() {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const addStop = useStopsStore((s) => s.addStop);
  const addStopWithCoords = useStopsStore((s) => s.addStopWithCoords);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const trimmed = value.trim();
  const directCoords = parseCoordinates(trimmed);
  const hasDirectCoords = directCoords !== null;
  const looksLikeUrl = isUrl(trimmed);

  // Debounce: buscar sugerencias 500ms después de que deje de escribir
  useEffect(() => {
    if (!trimmed || trimmed.length < 3 || hasDirectCoords || looksLikeUrl) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    const timer = setTimeout(async () => {
      try {
        const cleaned = cleanInput(trimmed);
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(cleaned)}`
        );
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [trimmed, hasDirectCoords, looksLikeUrl]);

  // Cerrar dropdown al tocar fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  function handleSelectSuggestion(suggestion: Suggestion) {
    addStopWithCoords(suggestion.label, suggestion.lat, suggestion.lng);
    setValue("");
    setSuggestions([]);
    setShowDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed || isSubmitting) return;

    // Camino 1: Coordenadas extraíbles directamente (link con coords o coords sueltas)
    if (directCoords) {
      console.log("[AddressForm] Coords directas:", directCoords);
      setIsSubmitting(true);
      setSuggestions([]);
      setShowDropdown(false);
      // Reverse geocode para obtener nombre descriptivo
      const label = await reverseGeocode(directCoords.lat, directCoords.lng);
      addStopWithCoords(label, directCoords.lat, directCoords.lng);
      setValue("");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setSuggestions([]);
    setShowDropdown(false);

    try {
      // Camino 2: Es un URL pero sin coords visibles → resolver redirects
      if (looksLikeUrl) {
        console.log("[AddressForm] Link sin coords, resolviendo:", trimmed);
        const res = await fetch(
          `/api/resolve-link?url=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();

        if (data.lat !== null && data.lat !== undefined && data.lng !== null) {
          console.log("[AddressForm] Link resuelto:", data);
          // Reverse geocode para nombre descriptivo
          const label = await reverseGeocode(data.lat, data.lng);
          addStopWithCoords(label, data.lat, data.lng);
          setValue("");
          setIsSubmitting(false);
          return;
        }

        console.log("[AddressForm] Link no resuelto, agregando sin coords");
        addStop(trimmed);
        setValue("");
        setIsSubmitting(false);
        return;
      }

      // Camino 3: Texto plano → geocodificar automáticamente
      const cleaned = cleanInput(trimmed);
      console.log("[AddressForm] Texto plano, geocodificando:", cleaned);
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(cleaned)}`
      );
      const data = await res.json();
      const results: Suggestion[] = data.results ?? [];

      if (results.length > 0) {
        console.log("[AddressForm] Geocodificado:", results[0]);
        addStopWithCoords(results[0].label, results[0].lat, results[0].lng);
      } else {
        console.log("[AddressForm] Sin resultados de geocoding, agregando como texto");
        addStop(cleaned);
      }

      setValue("");
    } catch (error) {
      console.error("[AddressForm] Error en submit:", error);
      addStop(trimmed);
      setValue("");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Determinar qué mensaje mostrar
  let inputHint: { text: string; color: string } | null = null;
  if (hasDirectCoords) {
    inputHint = { text: "Coordenadas detectadas.", color: "text-green-700" };
  } else if (looksLikeUrl) {
    inputHint = { text: "Link detectado — se resolverá al agregar.", color: "text-blue-700" };
  }

  const buttonLabel = isSubmitting
    ? "Buscando ubicación..."
    : hasDirectCoords
      ? "Agregar con coordenadas"
      : looksLikeUrl
        ? "Agregar Link"
        : "+ Agregar Parada";

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="address-input" className="text-lg font-semibold">
          Agregar parada
        </label>
        <Input
          id="address-input"
          type="text"
          placeholder="Escriba dirección o pegue un link"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          autoComplete="off"
          className="h-14 text-lg px-4"
          disabled={isSubmitting}
        />
        {inputHint && (
          <p className={`text-base font-medium ${inputHint.color}`}>
            {inputHint.text}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="h-14 text-lg font-bold rounded-xl"
          disabled={!trimmed || isSubmitting}
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {buttonLabel}
        </Button>
      </form>

      {/* Dropdown de sugerencias */}
      {showDropdown && (
        <div className="absolute top-[6.5rem] left-0 right-0 z-20 bg-white border-2 border-border rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {isSearching && (
            <div className="px-4 py-4 text-base text-muted-foreground text-center">
              Buscando...
            </div>
          )}

          {!isSearching && suggestions.length === 0 && trimmed.length >= 3 && (
            <div className="px-4 py-4 text-base text-muted-foreground text-center">
              Sin resultados. Use el botón para agregar como texto.
            </div>
          )}

          {!isSearching &&
            suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectSuggestion(s)}
                className="w-full text-left px-4 py-3 min-h-[48px] text-base border-b last:border-b-0 hover:bg-muted active:bg-muted transition-colors"
              >
                {s.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
