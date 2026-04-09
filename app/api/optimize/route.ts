import { NextRequest, NextResponse } from "next/server";

interface JobInput {
  id: string;
  location: [number, number]; // [lng, lat]
}

interface OptimizeRequest {
  origin: [number, number]; // [lng, lat]
  end?: [number, number]; // [lng, lat] — home location (opcional)
  jobs: JobInput[];
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key no configurada en el servidor." },
      { status: 500 }
    );
  }

  let body: OptimizeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido." },
      { status: 400 }
    );
  }

  const { origin, end, jobs } = body;

  if (!origin || !Array.isArray(origin) || origin.length !== 2) {
    return NextResponse.json(
      { error: "Ubicación de origen inválida." },
      { status: 400 }
    );
  }

  if (!jobs || jobs.length < 2) {
    return NextResponse.json(
      { error: "Se necesitan al menos 2 paradas para optimizar." },
      { status: 400 }
    );
  }

  // Construir vehicle con start y opcionalmente end (home)
  const vehicle: Record<string, unknown> = {
    id: 0,
    profile: "driving-car",
    start: origin,
  };

  if (end && Array.isArray(end) && end.length === 2) {
    vehicle.end = end;
    console.log("[optimize] Ruta circular: start →", origin, "→ end:", end);
  } else {
    console.log("[optimize] Ruta abierta: start →", origin);
  }

  const vroomPayload = {
    vehicles: [vehicle],
    jobs: jobs.map((job, index) => ({
      id: index,
      location: job.location,
    })),
  };

  try {
    console.log("[optimize] Payload VROOM:", JSON.stringify(vroomPayload));

    const orsResponse = await fetch(
      "https://api.openrouteservice.org/optimization",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify(vroomPayload),
      }
    );

    if (!orsResponse.ok) {
      const errorText = await orsResponse.text();
      console.error("[optimize] ORS error:", orsResponse.status, errorText);
      return NextResponse.json(
        { error: "Error del servicio de optimización. Intente de nuevo." },
        { status: 502 }
      );
    }

    const orsData = await orsResponse.json();

    const route = orsData.routes?.[0];
    if (!route || !route.steps) {
      return NextResponse.json(
        { error: "Respuesta inesperada del servicio de optimización." },
        { status: 502 }
      );
    }

    const orderedIds: string[] = route.steps
      .filter((step: { type: string }) => step.type === "job")
      .map((step: { job: number }) => jobs[step.job].id);

    console.log("[optimize] Orden optimizado:", orderedIds);

    return NextResponse.json({ orderedIds });
  } catch (error) {
    console.error("[optimize] Fetch to ORS failed:", error);
    return NextResponse.json(
      { error: "No se pudo conectar al servicio de optimización." },
      { status: 502 }
    );
  }
}
