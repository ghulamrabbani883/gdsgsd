
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.config import settings
from app.models.forecast import ForecastGeneration


UK_TIMEZONE = ZoneInfo("Europe/London")


class ForecastService:

    @staticmethod
    def get_decision_cutoff(delivery_time: datetime) -> datetime:
        """
        Returns the previous day's configured decision cutoff
        in UK local time, converted to UTC.
        """

        if delivery_time.tzinfo is None:
            raise ValueError("delivery_time must be timezone-aware")

        local_delivery = delivery_time.astimezone(UK_TIMEZONE)
        cutoff_date = local_delivery.date() - timedelta(days=1)

        cutoff_local = datetime(
            cutoff_date.year,
            cutoff_date.month,
            cutoff_date.day,
            settings.decision_cutoff_hour,
            0,
            0,
            tzinfo=UK_TIMEZONE
        )

        return cutoff_local.astimezone(timezone.utc)

    @staticmethod
    def select_latest_forecasts(
        db: Session,
        delivery_start: datetime,
        delivery_end: datetime
    ) -> list:
        """
        Selects the latest forecast published before the configured
        day-ahead decision cutoff for each delivery interval.
        """

        forecasts = (
            db.query(ForecastGeneration)
            .filter(
                ForecastGeneration.start_time >= delivery_start,
                ForecastGeneration.start_time < delivery_end
            )
            .order_by(
                ForecastGeneration.start_time,
                ForecastGeneration.publish_time
            )
            .all()
        )

        selected = {}

        for forecast in forecasts:

            cutoff = ForecastService.get_decision_cutoff(
                forecast.start_time
            )

            if forecast.publish_time > cutoff:
                continue

            existing = selected.get(forecast.start_time)

            if (
                existing is None
                or forecast.publish_time > existing.publish_time
            ):
                selected[forecast.start_time] = forecast

        return sorted(
            selected.values(),
            key=lambda item: item.start_time
        )

    @staticmethod
    def get_forecast_evolution(
        db: Session,
        delivery_time: datetime
    ) -> list:
        """
        Returns forecast vintages published on or before the
        requested delivery interval.
        """

        if delivery_time.tzinfo is None:
            raise ValueError("delivery_time must be timezone-aware")

        delivery_time = delivery_time.astimezone(timezone.utc)

        forecasts = (
            db.query(ForecastGeneration)
            .filter(
                ForecastGeneration.start_time == delivery_time,
                ForecastGeneration.publish_time <= delivery_time
            )
            .order_by(ForecastGeneration.publish_time)
            .all()
        )

        return forecasts


forecast_service = ForecastService()
