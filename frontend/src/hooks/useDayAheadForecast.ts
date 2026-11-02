import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import type { DayAheadForecastResponse } from "../types/forecast";

export function useDayAheadForecast(deliveryDate: string) {
  return useQuery<DayAheadForecastResponse>({
    queryKey: ["day-ahead-forecast", deliveryDate],

    queryFn: async () => {
      // The backend uses an exclusive end date.
      const nextDate = new Date(`${deliveryDate}T00:00:00`);
      nextDate.setDate(nextDate.getDate() + 1);

      const endDate = [
        nextDate.getFullYear(),
        String(nextDate.getMonth() + 1).padStart(2, "0"),
        String(nextDate.getDate()).padStart(2, "0"),
      ].join("-");

      const response = await api.get<DayAheadForecastResponse>(
        "/forecasts/latest",
        {
          params: {
            start_date: deliveryDate,
            end_date: endDate,
          },
        }
      );

      return response.data;
    },

    enabled: Boolean(deliveryDate),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}