"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStopsStore } from "@/lib/store";

interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

export default function HomeConfig() {
  const homeLocation = useStopsStore((s) => s.homeLocation);
  const setHomeLocation = useStopsStore((s) => s.setHomeLocation);
  const clearHomeLocation = useStopsStore((s) => s.clearHomeLocation);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const trimmed = value.trim();

  // Debounce búsqueda
  useEffect(() => {
    if (!trimmed || trimmed.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(trimmed)}`
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
  }, [trimmed]);

  // Click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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

  function handleSelect(s: Suggestion) {
    setHomeLocation(s.label, s.lat, s.lng);
    setValue("");
    setSuggestions([]);
    setShowDropdown(false);
    setIsEditing(false);
  }

  function handleClear() {
    clearHomeLocation();
    setValue("");
    setIsEditing(false);
  }

  // Vista compacta cuando hay home configurado y no se está editando
  if (homeLocation && !isEditing) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-muted rounded-xl border-2 border-border">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0 text-foreground" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span className="text-base font-semibold">Base:</span>
          <span className="text-base truncate">{homeLocation.address}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="flex-1 h-12 text-base font-semibold rounded-xl"
          >
            Cambiar
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            className="h-12 text-base font-semibold rounded-xl px-4"
          >
            Quitar
          </Button>
        </div>
      </div>
    );
  }

  // Vista de edición / configuración inicial
  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 flex-shrink-0 text-foreground" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
        <span className="text-base font-semibold">Definir punto de regreso (Base/Casa)</span>
      </div>
      <Input
        type="text"
        placeholder="Busque su base, bodega o casa"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true);
        }}
        autoComplete="off"
        className="h-12 text-base px-4"
      />
      {isEditing && (
        <Button
          variant="outline"
          onClick={() => { setIsEditing(false); setValue(""); }}
          className="h-10 text-base rounded-xl"
        >
          Cancelar
        </Button>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-[4.5rem] left-0 right-0 z-20 bg-white border-2 border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {isSearching && (
            <div className="px-4 py-3 text-base text-muted-foreground text-center">
              Buscando...
            </div>
          )}
          {!isSearching && suggestions.length === 0 && trimmed.length >= 3 && (
            <div className="px-4 py-3 text-base text-muted-foreground text-center">
              Sin resultados.
            </div>
          )}
          {!isSearching &&
            suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(s)}
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
