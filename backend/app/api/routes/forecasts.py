from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.services.analytics_service import analytics_service
from app.services.forecast_service import forecast_service
from app.api.routes.utils import get_date_range


router = APIRouter(
    prefix="/forecasts",
    tags=["Forecasts"]
)


@router.get("/latest")
def latest_forecasts(
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    db: Session = Depends(get_db)
):
    try:
        start, end = get_date_range(start_date, end_date)

        report = analytics_service.get_accuracy_report(
            db,
            start,
            end
        )

        return {
            "count": len(report["comparison"]),
            "data": report["comparison"]
        }

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/evolution")
def forecast_evolution(
    delivery_time: str = Query(...),
    db: Session = Depends(get_db)
):
    try:
        delivery_datetime = datetime.fromisoformat(
            delivery_time.replace("Z", "+00:00")
        )

        if delivery_datetime.tzinfo is None:
            raise ValueError("delivery_time must include a timezone")

        delivery_datetime = delivery_datetime.astimezone(
            timezone.utc
        )

        records = forecast_service.get_forecast_evolution(
            db,
            delivery_datetime
        )

        return {
            "delivery_time": delivery_datetime,
            "count": len(records),
            "data": [
                {
                    "publish_time": record.publish_time,
                    "generation_mw": record.generation_mw
                }
                for record in records
            ]
        }

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))