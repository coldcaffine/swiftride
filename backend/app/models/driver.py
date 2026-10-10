
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    license_number = Column(
        String(50),
        unique=True,
        nullable=False,
    )

    vehicle_make = Column(String(100), nullable=False)
    vehicle_model = Column(String(100), nullable=False)

    vehicle_plate = Column(
        String(20),
        unique=True,
        nullable=False,
    )

    is_available = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
