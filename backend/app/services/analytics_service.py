
import copy
import math
import threading
import time

from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.actual import ActualGeneration
from app.models.forecast import ForecastGeneration
from app.services.forecast_service import forecast_service


class AnalyticsService:

    LEAD_TIME_BUCKETS = [
        ("0-6 hours", 0, 6),
        ("6-12 hours", 6, 12),
        ("12-18 hours", 12, 18),
        ("18-24 hours", 18, 24),
        ("24-36 hours", 24, 36),
        ("36-48 hours", 36, 48),
        ("48+ hours", 48, float("inf")),
    ]

    def __init__(self):
        self._report_cache = {}
        self._cache_lock = threading.Lock()
        self._cache_ttl_seconds = 300

    # --------------------------------------------------
    # Cached analytics report
    # --------------------------------------------------

    def get_accuracy_report(
        self,
        db: Session,
        start: datetime,
        end: datetime
    ) -> dict:

        cache_key = (start, end)

        with self._cache_lock:

            now = time.monotonic()

            cached = self._report_cache.get(cache_key)

            if cached is not None:

                cached_time, cached_report = cached

                if now - cached_time < self._cache_ttl_seconds:
                    return copy.deepcopy(cached_report)

                # Remove expired entry
                self._report_cache.pop(cache_key, None)

            # Only one thread calculates a report for this
            # service instance at a time.
            report = self._build_accuracy_report(
                db,
                start,
                end
            )

            self._report_cache[cache_key] = (
                time.monotonic(),
                report
            )

            return copy.deepcopy(report)

    # --------------------------------------------------
    # Calculate forecast accuracy metrics
    # --------------------------------------------------

    @staticmethod
    def _calculate_metrics(pairs: list) -> dict:
        """
        Calculate forecast accuracy metrics.

        Error = forecast - actual
        Positive bias = overforecasting.
        Negative bias = underforecasting.
        MAPE excludes zero actual generation.
        """

        if not pairs:
            return {
                "matched_periods": 0,
                "mae_mw": None,
                "rmse_mw": None,
                "bias_mw": None,
                "mape_percentage": None,
            }

        errors = [
            pair["forecast_mw"] - pair["actual_mw"]
            for pair in pairs
        ]

        absolute_errors = [
            abs(error) for error in errors
        ]

        squared_errors = [
            error ** 2 for error in errors
        ]

        percentage_errors = [
            abs(pair["forecast_mw"] - pair["actual_mw"])
            / abs(pair["actual_mw"]) * 100
            for pair in pairs
            if pair["actual_mw"] != 0
        ]

        return {
            "matched_periods": len(pairs),

            "mae_mw": round(
                sum(absolute_errors) / len(absolute_errors),
                2
            ),

            "rmse_mw": round(
                math.sqrt(
                    sum(squared_errors) / len(squared_errors)
                ),
                2
            ),

            "bias_mw": round(
                sum(errors) / len(errors),
                2
            ),

            "mape_percentage": (
                round(
                    sum(percentage_errors)
                    / len(percentage_errors),
                    2
                )
                if percentage_errors else None
            ),
        }

    # --------------------------------------------------
    # Aggregate half-hour actuals into hourly actuals
    # --------------------------------------------------

    @staticmethod
    def _aggregate_actuals(
        db: Session,
        start: datetime,
        end: datetime
    ) -> dict:
        """
        Convert two consecutive half-hour actual records
        into one hourly average.

        Only complete hourly buckets are included.
        """

        records = (
            db.query(ActualGeneration)
            .filter(
                ActualGeneration.start_time >= start,
                ActualGeneration.start_time < end
            )
            .order_by(ActualGeneration.start_time)
            .all()
        )

        buckets = defaultdict(dict)

        for record in records:

            if record.generation_mw is None:
                continue

            hour = record.start_time.replace(
                minute=0,
                second=0,
                microsecond=0
            )

            buckets[hour][record.start_time.minute] = float(
                record.generation_mw
            )

        hourly_actuals = {}

        for hour, values in buckets.items():

            if 0 not in values or 30 not in values:
                continue

            hourly_actuals[hour] = (
                values[0] + values[30]
            ) / 2

        return hourly_actuals

    # --------------------------------------------------
    # Match forecasts with actual generation
    # --------------------------------------------------

    @staticmethod
    def _build_pairs(
        forecasts: list,
        actuals: dict
    ) -> list:
        """
        Match forecast delivery intervals with hourly actuals.
        """

        pairs = []

        for forecast in forecasts:

            actual = actuals.get(forecast.start_time)

            if actual is None:
                continue

            if forecast.generation_mw is None:
                continue

            pairs.append({
                "start_time": forecast.start_time,
                "publish_time": forecast.publish_time,
                "forecast_mw": float(forecast.generation_mw),
                "actual_mw": actual,
            })

        return pairs

    # --------------------------------------------------
    # Build complete analytics report
    # --------------------------------------------------

    def _build_accuracy_report(
        self,
        db: Session,
        start: datetime,
        end: datetime
    ) -> dict:

        # --------------------------------------------------
        # 1. Aggregate half-hour actuals into hourly actuals
        # --------------------------------------------------

        actuals = self._aggregate_actuals(
            db,
            start,
            end
        )

        # --------------------------------------------------
        # 2. Select day-ahead forecasts
        # --------------------------------------------------

        selected_forecasts = (
            forecast_service.select_latest_forecasts(
                db,
                start,
                end
            )
        )

        day_ahead_pairs = self._build_pairs(
            selected_forecasts,
            actuals
        )

        # --------------------------------------------------
        # 3. Fetch genuine pre-delivery forecast vintages
        # --------------------------------------------------

        all_forecasts = (
            db.query(ForecastGeneration)
            .filter(
                ForecastGeneration.start_time >= start,
                ForecastGeneration.start_time < end,

                # Strictly positive lead time.
                ForecastGeneration.publish_time
                < ForecastGeneration.start_time
            )
            .order_by(
                ForecastGeneration.start_time,
                ForecastGeneration.publish_time
            )
            .all()
        )

        vintage_pairs = self._build_pairs(
            all_forecasts,
            actuals
        )

        # --------------------------------------------------
        # 4. Summary metrics
        # --------------------------------------------------

        expected_periods = int(
            (end - start).total_seconds() / 3600
        )

        day_ahead_metrics = self._calculate_metrics(
            day_ahead_pairs
        )

        missing_actual = sum(
            1
            for forecast in selected_forecasts
            if forecast.start_time not in actuals
        )

        selected_times = {
            forecast.start_time
            for forecast in selected_forecasts
        }

        missing_forecast = sum(
            1
            for hour in actuals
            if start <= hour < end
            and hour not in selected_times
        )

        coverage = (
            len(day_ahead_pairs) / expected_periods * 100
            if expected_periods else 0
        )

        # --------------------------------------------------
        # 5. Daily accuracy
        # --------------------------------------------------

        daily_groups = defaultdict(list)

        for pair in day_ahead_pairs:

            daily_groups[
                pair["start_time"].date()
            ].append(pair)

        daily_accuracy = []

        current_date = start.date()
        final_date = end.date()

        while current_date < final_date:

            daily_pairs = daily_groups.get(
                current_date,
                []
            )

            metrics = self._calculate_metrics(
                daily_pairs
            )

            daily_accuracy.append({
                "delivery_date": current_date.isoformat(),
                "expected_periods": 24,
                **metrics,
            })

            current_date += timedelta(days=1)

        # --------------------------------------------------
        # 6. Lead-time accuracy
        # --------------------------------------------------

        lead_groups = defaultdict(list)

        for pair in vintage_pairs:

            lead_hours = (
                pair["start_time"] - pair["publish_time"]
            ).total_seconds() / 3600

            # Never include zero or negative lead times.
            if lead_hours <= 0:
                continue

            for label, lower, upper in self.LEAD_TIME_BUCKETS:

                if lower < lead_hours <= upper:
                    lead_groups[label].append(pair)
                    break

                # First bucket includes all positive leads
                # strictly below six hours.
                if lower == 0 and 0 < lead_hours <= upper:
                    lead_groups[label].append(pair)
                    break

        lead_time_accuracy = []

        for label, _, _ in self.LEAD_TIME_BUCKETS:

            pairs = lead_groups.get(label, [])

            metrics = self._calculate_metrics(pairs)

            # Count of forecast-vintage/actual observations,
            # not unique delivery intervals.
            forecast_observations = metrics.pop(
                "matched_periods"
            )

            lead_time_accuracy.append({
                "lead_time_bucket": label,
                "forecast_observations": forecast_observations,
                **metrics,
            })

        # --------------------------------------------------
        # 7. Day-ahead hourly comparison series
        # --------------------------------------------------

        comparison = []

        for pair in sorted(
            day_ahead_pairs,
            key=lambda item: item["start_time"]
        ):

            comparison.append({
                "start_time": pair["start_time"],
                "publish_time": pair["publish_time"],
                "forecast_mw": pair["forecast_mw"],
                "actual_mw": pair["actual_mw"],
                "error_mw": round(
                    pair["forecast_mw"] - pair["actual_mw"],
                    2
                ),
            })

        # --------------------------------------------------
        # 8. Final response
        # --------------------------------------------------

        return {
            "summary": {
                "expected_periods": expected_periods,
                "actual_hourly_periods": len(actuals),
                "forecast_periods": len(selected_forecasts),
                "matched_periods": len(day_ahead_pairs),
                "missing_actual_periods": missing_actual,
                "missing_forecast_periods": missing_forecast,
                "coverage_percentage": round(coverage, 2),
                **day_ahead_metrics,
            },

            "daily_accuracy": daily_accuracy,

            "lead_time_accuracy": lead_time_accuracy,

            "comparison": comparison,
        }


analytics_service = AnalyticsService()
