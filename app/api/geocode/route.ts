import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key no configurada en el servidor." },
      { status: 500 }
    );
  }

  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const params = new URLSearchParams({
      text: q.trim(),
      "boundary.country": "CR",
      size: "5",
    });

    const orsResponse = await fetch(
      `https://api.openrouteservice.org/geocode/autocomplete?${params}`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!orsResponse.ok) {
      console.error("ORS geocode error:", orsResponse.status);
      return NextResponse.json(
        { error: "Error del servicio de geocodificación." },
        { status: 502 }
      );
    }

    const data = await orsResponse.json();

    const results = (data.features ?? []).map(
      (f: { properties: { label: string }; geometry: { coordinates: [number, number] } }) => ({
        label: f.properties.label,
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Geocode fetch failed:", error);
    return NextResponse.json(
      { error: "No se pudo conectar al servicio de geocodificación." },
      { status: 502 }
    );
  }
}
