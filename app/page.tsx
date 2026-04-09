"use client";

import AddressForm from "@/components/AddressForm";
import HomeConfig from "@/components/HomeConfig";
import OptimizeButton from "@/components/OptimizeButton";
import RouteList from "@/components/RouteList";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <AddressForm />
      <HomeConfig />
      <OptimizeButton />
      <RouteList />
    </div>
  );
}
