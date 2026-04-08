"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddressFormProps {
  onAdd: (address: string) => void;
}

export default function AddressForm({ onAdd }: AddressFormProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="address-input" className="text-lg font-semibold">
        Agregar parada
      </label>
      <Input
        id="address-input"
        type="text"
        placeholder="Pegue dirección o link de Google Maps"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-14 text-lg px-4"
      />
      <Button
        type="submit"
        size="lg"
        className="h-14 text-lg font-bold rounded-xl"
      >
        + Agregar Parada
      </Button>
    </form>
  );
}
