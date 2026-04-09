interface Coordinates {
  lat: number;
  lng: number;
}

function isValidCoord(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function tryParseCoordPair(latStr: string, lngStr: string): Coordinates | null {
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (!isNaN(lat) && !isNaN(lng) && isValidCoord(lat, lng)) {
    return { lat, lng };
  }
  return null;
}

/**
 * Detecta si un texto es una URL (http:// o https://).
 */
export function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim());
}

/**
 * Limpia texto de input: decodifica URL encoding (+, %20, etc.)
 * y normaliza espacios.
 */
export function cleanInput(text: string): string {
  let cleaned = text.trim();

  // Si tiene + como separadores y no tiene espacios normales, decodificar
  if (cleaned.includes("+") && !cleaned.includes(" ")) {
    cleaned = cleaned.replace(/\+/g, " ");
  }

  // Decodificar %XX (URL encoding)
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // Si falla el decode, usar el texto tal cual
  }

  // Normalizar espacios múltiples
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

/**
 * Extrae coordenadas de un texto que puede ser un link de Waze, Google Maps,
 * Apple Maps, URI geo, coordenadas sueltas, o texto plano.
 * Retorna null si no encuentra coordenadas válidas.
 */
export function parseCoordinates(text: string): Coordinates | null {
  // Waze con parámetro ll: waze.com/ul?ll=9.9281,-84.0907
  const wazeMatch = text.match(/waze\.com\/ul\?[^#]*?ll=([-\d.]+),([-\d.]+)/i);
  if (wazeMatch) {
    const result = tryParseCoordPair(wazeMatch[1], wazeMatch[2]);
    if (result) return result;
  }

  // Google Maps @: google.com/maps/.../@9.9281,-84.0907,...
  const gmapsAtMatch = text.match(/@([-\d.]+),([-\d.]+)/);
  if (gmapsAtMatch) {
    const result = tryParseCoordPair(gmapsAtMatch[1], gmapsAtMatch[2]);
    if (result) return result;
  }

  // Google Maps query: ?q=9.9281,-84.0907 o query=9.9281,-84.0907
  const gmapsQueryMatch = text.match(/[?&](?:q|query)=([-\d.]+),([-\d.]+)/);
  if (gmapsQueryMatch) {
    const result = tryParseCoordPair(gmapsQueryMatch[1], gmapsQueryMatch[2]);
    if (result) return result;
  }

  // Google Maps place: /place/.../ seguido de coordenadas
  const gmapsPlaceMatch = text.match(/\/place\/[^/]+\/([-\d.]+),([-\d.]+)/);
  if (gmapsPlaceMatch) {
    const result = tryParseCoordPair(gmapsPlaceMatch[1], gmapsPlaceMatch[2]);
    if (result) return result;
  }

  // Apple Maps: maps.apple.com/?ll=9.9281,-84.0907
  const appleMapsMatch = text.match(/maps\.apple\.com\/?\?[^#]*?ll=([-\d.]+),([-\d.]+)/i);
  if (appleMapsMatch) {
    const result = tryParseCoordPair(appleMapsMatch[1], appleMapsMatch[2]);
    if (result) return result;
  }

  // URI geo (Android/WhatsApp): geo:9.9281,-84.0907 o geo:9.9281,-84.0907?z=17
  const geoMatch = text.match(/geo:([-\d.]+),([-\d.]+)/i);
  if (geoMatch) {
    const result = tryParseCoordPair(geoMatch[1], geoMatch[2]);
    if (result) return result;
  }

  // Coordenadas sueltas: "9.9281,-84.0907" o "9.9281, -84.0907"
  // Solo si el texto completo (trimmed) es un par de coordenadas
  const rawCoordsMatch = text.trim().match(/^([-\d.]+)\s*,\s*([-\d.]+)$/);
  if (rawCoordsMatch) {
    const result = tryParseCoordPair(rawCoordsMatch[1], rawCoordsMatch[2]);
    if (result) return result;
  }

  return null;
}
