
import json
import httpx

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
OPENAPI_URL = "https://data.elexon.co.uk/swagger/v1/swagger.json"


def inspect_schema(spec, schema_name):
    schema = spec["components"]["schemas"].get(schema_name)

    print(f"\n{'=' * 65}")
    print(f"SCHEMA: {schema_name}")
    print("=" * 65)

    if not schema:
        print("Schema not found")
        return

    print(json.dumps(schema.get("properties", {}), indent=2))


def inspect_sample(name, endpoint, params):
    print(f"\n{'=' * 65}")
    print(f"SAMPLE DATA: {name}")
    print("=" * 65)

    response = httpx.get(
        f"{BASE_URL}/{endpoint}",
        params=params,
        timeout=60
    )

    print("Status:", response.status_code)
    response.raise_for_status()

    data = response.json()

    print("Records returned:", len(data))

    if data:
        print("\nFirst record:")
        print(json.dumps(data[0], indent=2))

        print("\nAvailable fields:")
        print(list(data[0].keys()))
    else:
        print("No records returned for this query.")


def main():
    response = httpx.get(OPENAPI_URL, timeout=60)
    response.raise_for_status()

    spec = response.json()

    inspect_schema(
        spec,
        "Insights.Api.Models.Responses.Generation.DatasetRows.AugmentedOutturnData"
    )

    inspect_schema(
        spec,
        "Insights.Api.Models.Responses.Generation.DatasetRows.WindGenerationForecast"
    )

    # Actual wind generation for 1 January 2026
    inspect_sample(
        "FUELHH actual wind",
        "datasets/FUELHH/stream",
        {
            "settlementDateFrom": "2026-01-01",
            "settlementDateTo": "2026-01-01",
            "fuelType": ["WIND"]
        }
    )

    # Forecast publications during a small window on 31 December 2025
    inspect_sample(
        "WINDFOR forecast",
        "datasets/WINDFOR/stream",
        {
            "publishDateTimeFrom": "2025-12-31T00:00:00Z",
            "publishDateTimeTo": "2025-12-31T01:00:00Z"
        }
    )


if __name__ == "__main__":
    main()
