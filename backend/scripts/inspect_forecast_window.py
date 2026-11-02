
import httpx
from collections import Counter

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"

params = {
    "publishDateTimeFrom": "2025-12-30T00:00:00Z",
    "publishDateTimeTo": "2026-01-03T00:00:00Z",
}

response = httpx.get(
    f"{BASE_URL}/datasets/WINDFOR/stream",
    params=params,
    timeout=120
)

print("Status:", response.status_code)
response.raise_for_status()

records = response.json()

print("Total records:", len(records))

if not records:
    print("No forecast records found in this window.")
    raise SystemExit(0)

records.sort(
    key=lambda row: (
        row["publishTime"],
        row["startTime"]
    )
)

publish_times = sorted({
    row["publishTime"]
    for row in records
})

delivery_times = sorted({
    row["startTime"]
    for row in records
})

print("\nPublication range:")
print(publish_times[0])
print(publish_times[-1])

print("\nUnique publication timestamps:")
print(len(publish_times))

print("\nDelivery interval range:")
print(delivery_times[0])
print(delivery_times[-1])

print("\nRecords per publication:")
counts = Counter(row["publishTime"] for row in records)

for publish_time, count in sorted(counts.items()):
    print(publish_time, "->", count)

print("\nJanuary 2026 delivery records:")

january_records = [
    row for row in records
    if row["startTime"].startswith("2026-01")
]

print("Count:", len(january_records))

print("\nFirst 5 records:")

for record in january_records[:5]:
    print(record)

print("\nNull generation values:", sum(
    row.get("generation") is None
    for row in records
))

