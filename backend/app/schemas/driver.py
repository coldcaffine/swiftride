
from pydantic import BaseModel, Field, ConfigDict


class DriverRegister(BaseModel):
    license_number: str = Field(min_length=3, max_length=50)
    vehicle_make: str = Field(min_length=1, max_length=100)
    vehicle_model: str = Field(min_length=1, max_length=100)
    vehicle_plate: str = Field(min_length=3, max_length=20)


class DriverResponse(BaseModel):
    id: int
    user_id: int
    license_number: str
    vehicle_make: str
    vehicle_model: str
    vehicle_plate: str
    is_available: bool

    model_config = ConfigDict(from_attributes=True)
