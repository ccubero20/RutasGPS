import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { label: "Dirección de enlace" }
    );
  }

  const lat = request.nextUrl.searchParams.get("lat");
  const lng = request.nextUrl.searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Parámetros lat y lng requeridos." },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      "point.lat": lat,
      "point.lon": lng,
      size: "1",
    });

    const orsResponse = await fetch(
      `https://api.openrouteservice.org/geocode/reverse?${params}`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!orsResponse.ok) {
      console.error("[reverse-geocode] ORS error:", orsResponse.status);
      return NextResponse.json({ label: "Dirección de enlace" });
    }

    const data = await orsResponse.json();
    const feature = data.features?.[0];

    if (feature?.properties?.label) {
      return NextResponse.json({ label: feature.properties.label });
    }

    return NextResponse.json({ label: "Dirección de enlace" });
  } catch (error) {
    console.error("[reverse-geocode] Error:", error);
    return NextResponse.json({ label: "Dirección de enlace" });
  }
}
