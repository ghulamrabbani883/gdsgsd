from datetime import date, datetime, time, timezone

from app.config import settings


def get_date_range(
    start_date: date = None,
    end_date: date = None
):
    start = start_date or settings.delivery_start
    end = end_date or settings.delivery_end

    if start >= end:
        raise ValueError("start_date must be before end_date")

    start_datetime = datetime.combine(
        start,
        time.min,
        tzinfo=timezone.utc
    )

    end_datetime = datetime.combine(
        end,
        time.min,
        tzinfo=timezone.utc
    )

    return start_datetime, end_datetime