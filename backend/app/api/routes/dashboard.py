from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.services.analytics_service import analytics_service
from app.api.routes.utils import get_date_range


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def dashboard_summary(
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
            "period": {
                "start_date": start.date(),
                "end_date": end.date()
            },
            "summary": report["summary"]
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )