"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Stop {
  id: string;
  address: string;
}

interface RouteListProps {
  stops: Stop[];
  onRemove: (id: string) => void;
}

export default function RouteList({ stops, onRemove }: RouteListProps) {
  if (stops.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 text-lg">
        No hay paradas todavía.
        <br />
        Agregue direcciones arriba para comenzar.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">
        Paradas ({stops.length})
      </h2>
      {stops.map((stop, index) => (
        <Card key={stop.id} className="border-2">
          <CardContent className="flex flex-col gap-3 p-4">
            <p className="text-lg font-medium break-words">
              <span className="text-muted-foreground mr-2">{index + 1}.</span>
              {stop.address}
            </p>
            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex-1 h-14 text-base font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => {
                  window.open(
                    `https://waze.com/ul?q=${encodeURIComponent(stop.address)}`,
                    "_blank"
                  );
                }}
              >
                Ir con Waze
              </Button>
              <Button
                variant="default"
                className="flex-1 h-14 text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`,
                    "_blank"
                  );
                }}
              >
                Ir con Maps
              </Button>
            </div>
            <Button
              variant="destructive"
              className="h-12 text-base font-semibold rounded-xl"
              onClick={() => onRemove(stop.id)}
            >
              Eliminar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
