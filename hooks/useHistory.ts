import { useState, useEffect, useCallback } from "react";
import { useStopsStore } from "@/lib/store";
import { getHistoricalStops, getHistoryByDay, DayHistory } from "@/lib/supabase/history";

/**
 * Custom hook to fetch and manage historical stop data.
 * @param startDate - Optional start date for filtering.
 * @param endDate - Optional end date for filtering.
 * @returns An object containing data, loading state, error, and a refresh function.
 */
export function useHistory(startDate?: Date, endDate?: Date) {
  const [data, setData] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useStopsStore((state) => state.userId);

  const fetchHistory = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const historicalStops = await getHistoricalStops(userId, startDate, endDate);
      const groupedData = getHistoryByDay(historicalStops);
      setData(groupedData);
    } catch (err: any) {
      console.error("Error in useHistory:", err);
      setError(err.message || "Error al obtener el historial");
    } finally {
      setLoading(false);
    }
  }, [userId, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    data,
    loading,
    error,
    refresh: fetchHistory,
  };
}
