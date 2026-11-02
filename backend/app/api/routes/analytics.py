from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.services.analytics_service import analytics_service
from app.api.routes.utils import get_date_range


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


def get_report(db, start_date, end_date):
    start, end = get_date_range(start_date, end_date)

    return analytics_service.get_accuracy_report(
        db,
        start,
        end
    )


@router.get("/accuracy")
def accuracy(
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    db: Session = Depends(get_db)
):
    try:
        report = get_report(db, start_date, end_date)

        return report["summary"]

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/daily")
def daily_accuracy(
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    db: Session = Depends(get_db)
):
    try:
        report = get_report(db, start_date, end_date)

        return {
            "data": report["daily_accuracy"]
        }

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/lead-time")
def lead_time_accuracy(
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    db: Session = Depends(get_db)
):
    try:
        report = get_report(db, start_date, end_date)

        return {
            "data": report["lead_time_accuracy"]
        }

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))