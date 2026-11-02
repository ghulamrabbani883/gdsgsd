
import logging
from datetime import date, datetime, timezone

from app.database.db import Base, engine
from app.models.actual import ActualGeneration
from app.models.forecast import ForecastGeneration
from app.services.ingestion_service import IngestionService
from app.services.elexon_service import elexon_service


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)


def main():

    # Create tables for the initial local development setup.
    Base.metadata.create_all(bind=engine)

    service = IngestionService()

    try:
        print("\n========== ACTUAL GENERATION ==========\n")

        actual_result = service.ingest_actuals(
            start_date=date(2026, 1, 1),
            end_date=date(2026, 2, 1)
        )

        print(actual_result)

        print("\n========== WIND FORECASTS ==========\n")

        forecast_result = service.ingest_forecasts(
            publication_start=datetime(
                2025, 12, 30, 0, 0, tzinfo=timezone.utc
            ),
            publication_end=datetime(
                2026, 2, 1, 0, 0, tzinfo=timezone.utc
            ),
            delivery_start=datetime(
                2026, 1, 1, 0, 0, tzinfo=timezone.utc
            ),
            delivery_end=datetime(
                2026, 2, 1, 0, 0, tzinfo=timezone.utc
            )
        )

        print(forecast_result)

        print("\n========== INGESTION COMPLETED ==========\n")

    finally:
        elexon_service.close()


if __name__ == "__main__":
    main()
