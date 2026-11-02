
import logging
import time
from datetime import date, datetime, timedelta, timezone

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class ElexonAPIError(Exception):
    pass


class ElexonService:

    def __init__(self):
        self.base_url = settings.elexon_api_base_url.rstrip("/")
        self.timeout = settings.http_timeout_seconds
        self.client = httpx.Client(timeout=self.timeout)

    def close(self):
        self.client.close()

    def _get(self, endpoint: str, params: dict):
        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        for attempt in range(4):
            try:
                response = self.client.get(url, params=params)

                if response.status_code == 429 or response.status_code >= 500:
                    if attempt == 3:
                        response.raise_for_status()

                    retry_after = response.headers.get("Retry-After")

                    wait_seconds = (
                        float(retry_after)
                        if retry_after and retry_after.isdigit()
                        else 2 ** attempt
                    )

                    logger.warning(
                        "Elexon returned %s. Retrying in %s seconds",
                        response.status_code,
                        wait_seconds
                    )

                    time.sleep(wait_seconds)
                    continue

                response.raise_for_status()

                data = response.json()

                if not isinstance(data, list):
                    raise ElexonAPIError(
                        f"Unexpected response from {endpoint}"
                    )

                return data

            except httpx.HTTPError as exc:
                if attempt == 3:
                    raise ElexonAPIError(
                        f"Failed requesting {endpoint}: {exc}"
                    ) from exc

                time.sleep(2 ** attempt)

        raise ElexonAPIError(f"Request failed: {endpoint}")

    def fetch_actuals(self, settlement_date: date):
        return self._get(
            "datasets/FUELHH/stream",
            {
                "settlementDateFrom": settlement_date.isoformat(),
                "settlementDateTo": settlement_date.isoformat(),
                "fuelType": ["WIND"]
            }
        )

    def fetch_forecasts(
        self,
        publish_from: datetime,
        publish_to: datetime
    ):
        return self._get(
            "datasets/WINDFOR/stream",
            {
                "publishDateTimeFrom": (
                    publish_from.astimezone(timezone.utc)
                    .isoformat()
                    .replace("+00:00", "Z")
                ),
                "publishDateTimeTo": (
                    publish_to.astimezone(timezone.utc)
                    .isoformat()
                    .replace("+00:00", "Z")
                )
            }
        )


elexon_service = ElexonService()
