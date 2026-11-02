
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import type { DashboardResponse } from "../types/dashboard";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await api.get<DashboardResponse>(
        "/dashboard/summary"
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
