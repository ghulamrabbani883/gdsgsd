
from sqlalchemy import text

from app.database.db import engine


def main():
    with engine.connect() as connection:

        print("\n========== DATABASE VERIFICATION ==========\n")

        actual_count = connection.execute(
            text("SELECT COUNT(*) FROM actual_generation")
        ).scalar()

        forecast_count = connection.execute(
            text("SELECT COUNT(*) FROM forecast_generation")
        ).scalar()

        print("Actual records:", actual_count)
        print("Forecast records:", forecast_count)

        actual_range = connection.execute(
            text("""
                SELECT
                    MIN(start_time),
                    MAX(start_time),
                    COUNT(*) FILTER (
                        WHERE generation_mw IS NULL
                    )
                FROM actual_generation
            """)
        ).fetchone()

        print("\nActual generation:")
        print("First interval:", actual_range[0])
        print("Last interval:", actual_range[1])
        print("Null generation:", actual_range[2])

        forecast_range = connection.execute(
            text("""
                SELECT
                    MIN(start_time),
                    MAX(start_time),
                    MIN(publish_time),
                    MAX(publish_time),
                    COUNT(DISTINCT publish_time)
                FROM forecast_generation
            """)
        ).fetchone()

        print("\nForecast generation:")
        print("First delivery:", forecast_range[0])
        print("Last delivery:", forecast_range[1])
        print("First publication:", forecast_range[2])
        print("Last publication:", forecast_range[3])
        print("Unique publications:", forecast_range[4])

        print("\n========== VERIFICATION COMPLETED ==========")


if __name__ == "__main__":
    main()

