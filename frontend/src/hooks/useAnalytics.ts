
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import type {
  AnalyticsResponse,
  DailyAccuracy,
  ForecastEvolutionResponse,
  LeadTimeAccuracy,
} from "../types/analytics";
import type { ComparisonPoint } from "../types/dashboard";

export function useAnalytics() {
  return useQuery({
    queryKey: ["forecast-analytics"],
    queryFn: async () => {
      const [summary, daily, leadTime, comparison] =
        await Promise.all([
          api.get<AnalyticsResponse["summary"]>(
            "/analytics/accuracy"
          ),
          api.get<{ data: DailyAccuracy[] }>(
            "/analytics/daily"
          ),
          api.get<{ data: LeadTimeAccuracy[] }>(
            "/analytics/lead-time"
          ),
          api.get<{ data: ComparisonPoint[] }>(
            "/forecasts/latest"
          ),
        ]);

      return {
        summary: summary.data,
        daily_accuracy: daily.data.data,
        lead_time_accuracy: leadTime.data.data,
        comparison: comparison.data.data,
      } satisfies AnalyticsResponse;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useForecastEvolution(deliveryTime: string) {
  return useQuery({
    queryKey: ["forecast-evolution", deliveryTime],
    queryFn: async () => {
      const response = await api.get<ForecastEvolutionResponse>(
        "/forecasts/evolution",
        {
          params: { delivery_time: deliveryTime },
        }
      );
      return response.data;
    },
    enabled: Boolean(deliveryTime),
    staleTime: 5 * 60 * 1000,
  });
}
