from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    delivery_start: str
    delivery_end: str

    expected_periods: int
    actual_periods: int
    forecast_periods: int
    matched_periods: int

    coverage_percentage: float

    average_forecast_mw: Optional[float]
    average_actual_mw: Optional[float]

    latest_publish_time: Optional[datetime]

    mae_mw: Optional[float]
    rmse_mw: Optional[float]
    bias_mw: Optional[float]
    mape_percentage: Optional[float]


class ForecastPoint(BaseModel):
    start_time: datetime
    publish_time: datetime
    generation_mw: Optional[float]


class GenerationComparison(BaseModel):
    start_time: datetime
    forecast_mw: Optional[float]
    actual_mw: Optional[float]
    error_mw: Optional[float]
    publish_time: Optional[datetime]