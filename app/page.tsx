"use client";

import { useState } from "react";
import AddressForm from "@/components/AddressForm";
import RouteList from "@/components/RouteList";

interface Stop {
  id: string;
  address: string;
}

export default function Home() {
  const [stops, setStops] = useState<Stop[]>([]);

  function addStop(address: string) {
    setStops((prev) => [
      ...prev,
      { id: crypto.randomUUID(), address },
    ]);
  }

  function removeStop(id: string) {
    setStops((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-8">
      <AddressForm onAdd={addStop} />
      <RouteList stops={stops} onRemove={removeStop} />
    </div>
  );
}
