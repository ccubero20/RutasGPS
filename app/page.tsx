"use client";

import AddressForm from "@/components/AddressForm";
import RouteList from "@/components/RouteList";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <AddressForm />
      <RouteList />
    </div>
  );
}
