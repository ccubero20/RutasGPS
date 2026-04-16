import { createClient } from "./client";
import { Stop, StopStatus } from "../store";

export interface HistoricalStop extends Stop {
  created_at: string;
}

export interface DayHistory {
  date: string; // YYYY-MM-DD
  total: number;
  delivered: number;
  failed: number;
  stops: HistoricalStop[];
}

/**
 * Fetches historical stops for a specific user within a given timeframe.
 * @param userId - The ID of the authenticated user.
 * @param startDate - Optional start date for filtering.
 * @param endDate - Optional end date for filtering (inclusive).
 * @returns A promise that resolves to an array of HistoricalStop objects.
 */
export async function getHistoricalStops(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<HistoricalStop[]> {
  const supabase = createClient();

  let finalStartDate = startDate;
  if (!finalStartDate) {
    finalStartDate = new Date();
    finalStartDate.setDate(finalStartDate.getDate() - 30);
    // Reset to start of day for consistency
    finalStartDate.setHours(0, 0, 0, 0);
  }

  let query = supabase
    .from("stops")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", finalStartDate.toISOString())
    .order("created_at", { ascending: false });

  if (endDate) {
    const finalEndDate = new Date(endDate);
    finalEndDate.setHours(23, 59, 59, 999);
    query = query.lte("created_at", finalEndDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching historical stops:", error);
    return [];
  }

  return (data || []).map((s) => ({
    id: s.id,
    textoOriginal: s.name || s.address,
    lat: s.coordinates?.lat ?? null,
    lng: s.coordinates?.lng ?? null,
    status: (s.status as StopStatus) || "pending",
    notes: s.notes || "",
    created_at: s.created_at,
  }));
}

/**
 * Groups historical stops by date and calculates performance metrics.
 * Uses America/Costa_Rica (GMT-6) timezone for grouping to avoid UTC date shifting.
 * @param stops - Array of HistoricalStop objects.
 * @returns An array of DayHistory objects, sorted by date descending.
 */
export function getHistoryByDay(stops: HistoricalStop[]): DayHistory[] {
  // Formatter for YYYY-MM-DD in Costa Rica timezone
  const dateOptions = {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  } as const;
  const formatter = new Intl.DateTimeFormat("en-CA", dateOptions); // 'en-CA' gives YYYY-MM-DD

  const grouped = stops.reduce((acc, stop) => {
    // Extract local date in Costa Rica
    const date = formatter.format(new Date(stop.created_at));
    
    if (!acc[date]) {
      acc[date] = {
        date,
        total: 0,
        delivered: 0,
        failed: 0,
        stops: [],
      };
    }
    acc[date].stops.push(stop);
    acc[date].total++;
    if (stop.status === "delivered") acc[date].delivered++;
    if (stop.status === "failed") acc[date].failed++;
    return acc;
  }, {} as Record<string, DayHistory>);

  return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
}
