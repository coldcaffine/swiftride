
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


class RideCreate(BaseModel):
    pickup_location: str = Field(min_length=3, max_length=255)
    dropoff_location: str = Field(min_length=3, max_length=255)


class RideResponse(BaseModel):
    id: int
    user_id: int
    driver_id: int | None
    pickup_location: str
    dropoff_location: str
    status: str
    fare: Decimal | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
