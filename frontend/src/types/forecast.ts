
export interface DayAheadForecastPoint {
  start_time: string;
  publish_time: string;
  forecast_mw: number | null;
  actual_mw: number | null;
  error_mw: number | null;
}

export interface DayAheadForecastResponse {
  count: number;
  data: DayAheadForecastPoint[];
}
