import type { ComparisonPoint } from "./dashboard";

export interface DailyAccuracy {
  delivery_date: string;
  expected_periods: number;
  matched_periods: number;
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  mape_percentage: number | null;
}

export interface LeadTimeAccuracy {
  lead_time_bucket: string;
  forecast_observations: number;
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  mape_percentage: number | null;
}

export interface AnalyticsResponse {
  summary: {
    expected_periods: number;
    actual_hourly_periods: number;
    forecast_periods: number;
    matched_periods: number;
    missing_actual_periods: number;
    missing_forecast_periods: number;
    coverage_percentage: number;
    mae_mw: number | null;
    rmse_mw: number | null;
    bias_mw: number | null;
    mape_percentage: number | null;
  };
  daily_accuracy: DailyAccuracy[];
  lead_time_accuracy: LeadTimeAccuracy[];
  comparison: ComparisonPoint[];
}

export interface ForecastEvolutionPoint {
  publish_time: string;
  generation_mw: number;
}

export interface ForecastEvolutionResponse {
  delivery_time: string;
  count: number;
  data: ForecastEvolutionPoint[];
}
