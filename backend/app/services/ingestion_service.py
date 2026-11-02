
import logging
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.dialects.postgresql import insert

from app.database.db import SessionLocal
from app.models.actual import ActualGeneration
from app.models.forecast import ForecastGeneration
from app.services.elexon_service import elexon_service

logger = logging.getLogger(__name__)


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(
        value.replace("Z", "+00:00")
    ).astimezone(timezone.utc)


class IngestionService:

    def __init__(self):
        self.actual_fetched = 0
        self.forecast_fetched = 0

    def ingest_actuals(self, start_date: date, end_date: date):
        """
        end_date is exclusive.
        Fetches actual generation one settlement day at a time.
        """

        records = []
        current_date = start_date

        while current_date < end_date:

            logger.info("Fetching actuals for %s", current_date)

            daily_records = elexon_service.fetch_actuals(current_date)

            for row in daily_records:

                if row.get("fuelType") != "WIND":
                    continue

                if not row.get("startTime"):
                    continue

                records.append({
                    "start_time": parse_timestamp(row["startTime"]),
                    "publish_time": (
                        parse_timestamp(row["publishTime"])
                        if row.get("publishTime")
                        else None
                    ),
                    "generation_mw": (
                        float(row["generation"])
                        if row.get("generation") is not None
                        else None
                    )
                })

            self.actual_fetched += len(daily_records)
            current_date += timedelta(days=1)

        inserted = self._save_actuals(records)

        return {
            "fetched": self.actual_fetched,
            "processed": len(records),
            "inserted_or_updated": inserted
        }

    def ingest_forecasts(
        self,
        publication_start: datetime,
        publication_end: datetime,
        delivery_start: datetime,
        delivery_end: datetime
    ):
        """
        Fetches forecast publications in daily publication windows.

        Retains every publication vintage whose delivery time falls
        inside the requested delivery window.
        """

        records = []

        current_time = publication_start

        while current_time < publication_end:

            next_time = min(
                current_time + timedelta(days=1),
                publication_end
            )

            logger.info(
                "Fetching forecasts published between %s and %s",
                current_time,
                next_time
            )

            daily_records = elexon_service.fetch_forecasts(
                current_time,
                next_time
            )

            self.forecast_fetched += len(daily_records)

            for row in daily_records:

                if not row.get("startTime") or not row.get("publishTime"):
                    continue

                start_time = parse_timestamp(row["startTime"])

                if not (
                    delivery_start <= start_time < delivery_end
                ):
                    continue

                records.append({
                    "start_time": start_time,
                    "publish_time": parse_timestamp(row["publishTime"]),
                    "generation_mw": (
                        float(row["generation"])
                        if row.get("generation") is not None
                        else None
                    )
                })

            current_time = next_time

        inserted = self._save_forecasts(records)

        return {
            "fetched": self.forecast_fetched,
            "processed": len(records),
            "inserted": inserted
        }

    def _save_actuals(self, records):

        if not records:
            return 0

        inserted = 0

        with SessionLocal() as db:

            statement = insert(ActualGeneration).values(records)

            statement = statement.on_conflict_do_update(
                constraint="uq_actual_start_time",
                set_={
                    "generation_mw": statement.excluded.generation_mw,
                    "publish_time": statement.excluded.publish_time
                }
            )

            result = db.execute(statement)
            db.commit()

            inserted = result.rowcount or 0

        return inserted

    def _save_forecasts(self, records):

        if not records:
            return 0

        with SessionLocal() as db:

            statement = insert(ForecastGeneration).values(records)

            statement = statement.on_conflict_do_nothing(
                constraint="uq_forecast_start_publish"
            )

            result = db.execute(statement)
            db.commit()

            return result.rowcount or 0


ingestion_service = IngestionService()
