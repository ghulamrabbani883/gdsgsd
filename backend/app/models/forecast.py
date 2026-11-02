from datetime import datetime
from typing import Optional

from sqlalchemy import (
    DateTime,
    Float,
    Integer,
    UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.db import Base


class ForecastGeneration(Base):
    __tablename__ = "forecast_generation"

    __table_args__ = (
        UniqueConstraint(
            "start_time",
            "publish_time",
            name="uq_forecast_start_publish"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )

    publish_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )

    generation_mw: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True
    )