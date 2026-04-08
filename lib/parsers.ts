interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Extrae coordenadas de un texto que puede ser un link de Waze, Google Maps,
 * o texto plano. Retorna null si no encuentra coordenadas válidas.
 */
export function parseCoordinates(text: string): Coordinates | null {
  // Rango válido para Costa Rica (con margen generoso)
  function isValidCoord(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  // Waze: waze.com/ul?ll=9.9281,-84.0907
  const wazeMatch = text.match(/waze\.com\/ul\?[^#]*?ll=([-\d.]+),([-\d.]+)/i);
  if (wazeMatch) {
    const lat = parseFloat(wazeMatch[1]);
    const lng = parseFloat(wazeMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && isValidCoord(lat, lng)) {
      return { lat, lng };
    }
  }

  // Google Maps @: google.com/maps/.../@9.9281,-84.0907,...
  const gmapsAtMatch = text.match(/@([-\d.]+),([-\d.]+)/);
  if (gmapsAtMatch) {
    const lat = parseFloat(gmapsAtMatch[1]);
    const lng = parseFloat(gmapsAtMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && isValidCoord(lat, lng)) {
      return { lat, lng };
    }
  }

  // Google Maps query: ?q=9.9281,-84.0907 o query=9.9281,-84.0907
  const gmapsQueryMatch = text.match(/[?&](?:q|query)=([-\d.]+),([-\d.]+)/);
  if (gmapsQueryMatch) {
    const lat = parseFloat(gmapsQueryMatch[1]);
    const lng = parseFloat(gmapsQueryMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && isValidCoord(lat, lng)) {
      return { lat, lng };
    }
  }

  // Google Maps place: /place/.../ seguido de coordenadas
  const gmapsPlaceMatch = text.match(/\/place\/[^/]+\/([-\d.]+),([-\d.]+)/);
  if (gmapsPlaceMatch) {
    const lat = parseFloat(gmapsPlaceMatch[1]);
    const lng = parseFloat(gmapsPlaceMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && isValidCoord(lat, lng)) {
      return { lat, lng };
    }
  }

  return null;
}
