
import httpx
from collections import defaultdict
from datetime import datetime, timezone

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"


def parse_time(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def main():
    # Fetch actual half-hourly wind generation for 1 January.
    actual_response = httpx.get(
        f"{BASE_URL}/datasets/FUELHH/stream",
        params={
            "settlementDateFrom": "2026-01-01",
            "settlementDateTo": "2026-01-01",
            "fuelType": ["WIND"],
        },
        timeout=60,
    )
    actual_response.raise_for_status()
    actual_records = actual_response.json()

    # Fetch the publication around the previous-day noon cutoff.
    forecast_response = httpx.get(
        f"{BASE_URL}/datasets/WINDFOR/stream",
        params={
            "publishDateTimeFrom": "2025-12-31T11:00:00Z",
            "publishDateTimeTo": "2025-12-31T12:00:00Z",
        },
        timeout=60,
    )
    forecast_response.raise_for_status()
    forecast_records = forecast_response.json()

    forecasts = [
        row for row in forecast_records
        if row["publishTime"] == "2025-12-31T11:30:00Z"
        and row["startTime"].startswith("2026-01-01")
    ]

    forecasts.sort(key=lambda row: row["startTime"])

    print("Actual records:", len(actual_records))
    print("Forecast records for selected publication:", len(forecasts))

    if not forecasts:
        print("No matching forecast records found.")
        return

    print("\nForecast publication:", forecasts[0]["publishTime"])

    forecast_times = [
        parse_time(row["startTime"])
        for row in forecasts
    ]

    print("Forecast delivery range:")
    print(forecast_times[0], "to", forecast_times[-1])

    print("\nForecast interval differences:")

    for previous, current in zip(
        forecast_times,
        forecast_times[1:]
    ):
        print(current - previous)
        break

    # Aggregate actual 30-minute intervals into hourly averages.
    actual_by_hour = defaultdict(list)

    for row in actual_records:
        if row["generation"] is None:
            continue

        start_time = parse_time(row["startTime"])
        hour = start_time.replace(minute=0, second=0, microsecond=0)

        actual_by_hour[hour].append(float(row["generation"]))

    hourly_actuals = {
        hour: sum(values) / len(values)
        for hour, values in actual_by_hour.items()
    }

    print("\nHourly actual aggregation:")
    print("Hourly buckets:", len(hourly_actuals))

    print("\nFirst 10 comparisons:")
    print(
        f"{'Delivery time':<28}"
        f"{'Forecast MW':>15}"
        f"{'Actual MW':>15}"
    )

    matched = 0

    for row in forecasts[:10]:
        start_time = parse_time(row["startTime"])
        actual = hourly_actuals.get(start_time)

        if actual is not None:
            matched += 1

        forecast = row["generation"]

        print(
            f"{str(start_time):<28}"
            f"{str(forecast):>15}"
            f"{str(round(actual, 2) if actual is not None else None):>15}"
        )

    print("\nMatched intervals in first 10:", matched)


if __name__ == "__main__":
    main()
