from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AccuracyMetrics(BaseModel):
    total_periods: int
    matched_periods: int
    missing_actual_periods: int
    missing_forecast_periods: int

    coverage_percentage: float

    mae_mw: Optional[float]
    rmse_mw: Optional[float]
    bias_mw: Optional[float]
    mape_percentage: Optional[float]


class DailyAccuracy(BaseModel):
    delivery_date: str
    matched_periods: int
    mae_mw: Optional[float]
    rmse_mw: Optional[float]
    bias_mw: Optional[float]


class LeadTimeAccuracy(BaseModel):
    lead_time_bucket: str
    forecast_observations: int
    mae_mw: Optional[float] = None
    rmse_mw: Optional[float] = None
    bias_mw: Optional[float] = None
    mape_percentage: Optional[float] = None

    
class ForecastEvolutionPoint(BaseModel):
    publish_time: datetime
    generation_mw: Optional[float]


class IngestionResult(BaseModel):
    dataset: str
    fetched_records: int
    inserted_records: int
    skipped_records: int