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


class ActualGeneration(Base):
    __tablename__ = "actual_generation"

    __table_args__ = (
        UniqueConstraint(
            "start_time",
            name="uq_actual_start_time"
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

    publish_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    generation_mw: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True
    )