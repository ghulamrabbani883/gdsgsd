
import pytest

from app.services.analytics_service import AnalyticsService


def test_calculate_metrics():

    pairs = [
        {"forecast_mw": 110, "actual_mw": 100},
        {"forecast_mw": 180, "actual_mw": 200},
        {"forecast_mw": 320, "actual_mw": 300},
    ]

    result = AnalyticsService._calculate_metrics(pairs)

    assert result["matched_periods"] == 3
    assert result["mae_mw"] == pytest.approx(16.67, abs=0.01)
    assert result["bias_mw"] == pytest.approx(3.33, abs=0.01)


def test_calculate_metrics_with_zero_actual():

    pairs = [
        {"forecast_mw": 100, "actual_mw": 0},
        {"forecast_mw": 110, "actual_mw": 100},
    ]

    result = AnalyticsService._calculate_metrics(pairs)

    assert result["matched_periods"] == 2
    assert result["mape_percentage"] == 10.0


def test_calculate_metrics_with_empty_data():

    result = AnalyticsService._calculate_metrics([])

    assert result["matched_periods"] == 0
    assert result["mae_mw"] is None
    assert result["rmse_mw"] is None
    assert result["bias_mw"] is None
    assert result["mape_percentage"] is None
