
export interface DashboardSummary {
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
}

export interface DashboardResponse {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: DashboardSummary;
}

export interface ComparisonPoint {
  start_time: string;
  publish_time: string;
  forecast_mw: number;
  actual_mw: number;
  error_mw: number;
}
