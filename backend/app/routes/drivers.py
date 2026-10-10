from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import jwt

from app.database import get_db
from app.models.user import User
from app.models.driver import Driver
from app.models.ride import Ride
from app.schemas.driver import DriverRegister, DriverResponse
from app.schemas.ride import RideResponse
from app.core.security import decode_access_token

router = APIRouter(prefix="/drivers", tags=["Drivers"])
bearer_scheme = HTTPBearer()


def get_logged_in_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = decode_access_token(credentials.credentials)
        subject = payload.get("sub")
        if not subject:
            raise ValueError("Missing user ID")
        user_id = int(subject)
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(401, "Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, "User not found")
    return user


def get_driver(current_user: User, db: Session) -> Driver:
    driver = db.query(Driver).filter(
        Driver.user_id == current_user.id
    ).first()
    if not driver:
        raise HTTPException(404, "Register as a driver first")
    return driver


@router.post("/register", response_model=DriverResponse,
             status_code=status.HTTP_201_CREATED)
def register_driver(
    data: DriverRegister,
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Driver).filter(
        (Driver.user_id == current_user.id)
        | (Driver.license_number == data.license_number.strip())
        | (Driver.vehicle_plate == data.vehicle_plate.strip().upper())
    ).first()
    if existing:
        raise HTTPException(
            409, "Driver, license, or plate already registered")

    driver = Driver(
        user_id=current_user.id,
        license_number=data.license_number.strip(),
        vehicle_make=data.vehicle_make.strip(),
        vehicle_model=data.vehicle_model.strip(),
        vehicle_plate=data.vehicle_plate.strip().upper(),
        is_available=False,
    )
    db.add(driver)
    try:
        db.commit()
        db.refresh(driver)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Driver details already exist")
    return driver


@router.get("/me", response_model=DriverResponse)
def get_my_driver_profile(
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    return get_driver(current_user, db)


@router.get("/me/assigned-rides", response_model=list[RideResponse])
def get_my_assigned_rides(
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    driver = get_driver(current_user, db)

    return (
        db.query(Ride)
        .filter(Ride.driver_id == driver.id)
        .order_by(Ride.created_at.desc())
        .all()
    )


@router.patch("/availability")
def update_driver_availability(
    is_available: bool,
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    driver = get_driver(current_user, db)
    driver.is_available = is_available
    db.commit()
    db.refresh(driver)
    return {"message": "Availability updated", "is_available": driver.is_available}


@router.get("/available-rides", response_model=list[RideResponse])
def get_available_rides(
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    driver = get_driver(current_user, db)
    if not driver.is_available:
        return []
    return (
        db.query(Ride)
        .filter(Ride.status == "requested", Ride.driver_id.is_(None))
        .order_by(Ride.created_at.asc())
        .all()
    )


@router.post("/rides/{ride_id}/accept", response_model=RideResponse)
def accept_ride(
    ride_id: int,
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    driver = get_driver(current_user, db)

    # Lock the ride so concurrent drivers cannot accept it simultaneously.
    ride = (
        db.query(Ride)
        .filter(Ride.id == ride_id)
        .with_for_update()
        .first()
    )
    if not ride:
        raise HTTPException(404, "Ride not found")
    if not driver.is_available:
        raise HTTPException(400, "Set yourself available first")
    if ride.status != "requested" or ride.driver_id is not None:
        raise HTTPException(409, "This ride has already been taken")

    ride.driver_id = driver.id
    ride.status = "accepted"
    driver.is_available = False
    db.commit()
    db.refresh(ride)
    return ride


@router.patch("/rides/{ride_id}/status", response_model=RideResponse)
def update_ride_status(
    ride_id: int,
    new_status: str,
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    driver = get_driver(current_user, db)
    ride = (
        db.query(Ride)
        .filter(Ride.id == ride_id, Ride.driver_id == driver.id)
        .with_for_update()
        .first()
    )
    if not ride:
        raise HTTPException(404, "Ride assigned to you not found")

    allowed = {
        "accepted": {"ongoing"},
        "ongoing": {"completed"},
    }
    if new_status not in allowed.get(ride.status, set()):
        raise HTTPException(400, "Invalid ride status transition")

    ride.status = new_status
    if new_status == "completed":
        driver.is_available = True

    db.commit()
    db.refresh(ride)
    return ride
