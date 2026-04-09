import { NextRequest, NextResponse } from "next/server";

// Reutilizamos la lógica de parseo del lado del servidor
function parseCoordinatesFromUrl(url: string): { lat: number; lng: number } | null {
  function tryParse(latStr: string, lngStr: string) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
    return null;
  }

  // Waze ll=
  const wazeMatch = url.match(/waze\.com\/ul\?[^#]*?ll=([-\d.]+),([-\d.]+)/i);
  if (wazeMatch) return tryParse(wazeMatch[1], wazeMatch[2]);

  // Google Maps @lat,lng
  const atMatch = url.match(/@([-\d.]+),([-\d.]+)/);
  if (atMatch) return tryParse(atMatch[1], atMatch[2]);

  // Google Maps ?q= o &query=
  const queryMatch = url.match(/[?&](?:q|query)=([-\d.]+),([-\d.]+)/);
  if (queryMatch) return tryParse(queryMatch[1], queryMatch[2]);

  // Google Maps /place/.../lat,lng
  const placeMatch = url.match(/\/place\/[^/]+\/([-\d.]+),([-\d.]+)/);
  if (placeMatch) return tryParse(placeMatch[1], placeMatch[2]);

  // Google Maps !3d (lat) y !4d (lng) en URLs expandidas
  const dMatch = url.match(/!3d([-\d.]+).*?!4d([-\d.]+)/);
  if (dMatch) return tryParse(dMatch[1], dMatch[2]);

  return null;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "Parámetro 'url' requerido." },
      { status: 400 }
    );
  }

  // Primero intentar parsear la URL original (por si ya tiene coords)
  const directParse = parseCoordinatesFromUrl(url);
  if (directParse) {
    console.log("[resolve-link] Coords found in original URL:", directParse);
    return NextResponse.json(directParse);
  }

  // Seguir redirects para obtener la URL final
  try {
    console.log("[resolve-link] Following redirects for:", url);
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RutasApp/1.0)",
      },
    });

    // La URL final después de los redirects
    const finalUrl = response.url;
    console.log("[resolve-link] Final URL:", finalUrl);

    const coords = parseCoordinatesFromUrl(finalUrl);
    if (coords) {
      console.log("[resolve-link] Coords extracted:", coords);
      return NextResponse.json(coords);
    }

    // Si la URL final no tiene coords en la URL, intentar buscar en el HTML
    const html = await response.text();

    // Buscar coordenadas en meta tags o scripts del HTML
    const htmlAtMatch = html.match(/@([-\d.]+),([-\d.]+)/);
    if (htmlAtMatch) {
      const lat = parseFloat(htmlAtMatch[1]);
      const lng = parseFloat(htmlAtMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        console.log("[resolve-link] Coords found in HTML:", { lat, lng });
        return NextResponse.json({ lat, lng });
      }
    }

    // Buscar !3d / !4d en el HTML (Google Maps embebido)
    const htmlDMatch = html.match(/!3d([-\d.]+).*?!4d([-\d.]+)/);
    if (htmlDMatch) {
      const lat = parseFloat(htmlDMatch[1]);
      const lng = parseFloat(htmlDMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        console.log("[resolve-link] Coords found in HTML (3d/4d):", { lat, lng });
        return NextResponse.json({ lat, lng });
      }
    }

    console.log("[resolve-link] No coords found after following redirects");
    return NextResponse.json({ lat: null, lng: null });
  } catch (error) {
    console.error("[resolve-link] Error following redirects:", error);
    return NextResponse.json(
      { error: "No se pudo resolver el link." },
      { status: 502 }
    );
  }
}
