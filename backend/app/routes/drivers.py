
from decimal import Decimal

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.driver import Driver
from app.models.ride import Ride
from app.models.user import User
from app.schemas.driver import DriverRegister, DriverResponse
from app.schemas.ride import RideResponse
from app.services.fare import calculate_fare
from app.services.matching import get_available_rides as find_available_rides


router = APIRouter(prefix="/drivers", tags=["Drivers"])
bearer_scheme = HTTPBearer()


def get_logged_in_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(credentials.credentials)
        subject = payload.get("sub")

        if not subject:
            raise ValueError("Missing user ID")

        user_id = int(subject)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def get_driver(current_user: User, db: Session) -> Driver:
    driver = (
        db.query(Driver)
        .filter(Driver.user_id == current_user.id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Register as a driver first",
        )

    return driver


@router.post(
    "/register",
    response_model=DriverResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_driver(
    data: DriverRegister,
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    license_number = data.license_number.strip()
    vehicle_plate = data.vehicle_plate.strip().upper()

    existing = (
        db.query(Driver)
        .filter(
            (Driver.user_id == current_user.id)
            | (Driver.license_number == license_number)
            | (Driver.vehicle_plate == vehicle_plate)
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Driver, license, or plate already registered",
        )

    driver = Driver(
        user_id=current_user.id,
        license_number=license_number,
        vehicle_make=data.vehicle_make.strip(),
        vehicle_model=data.vehicle_model.strip(),
        vehicle_plate=vehicle_plate,
        is_available=False,
    )

    db.add(driver)

    try:
        db.commit()
        db.refresh(driver)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Driver details already exist",
        )

    return driver


@router.get("/me", response_model=DriverResponse)
def get_my_driver_profile(
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    return get_driver(current_user, db)


@router.get(
    "/me/assigned-rides",
    response_model=list[RideResponse],
)
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

    active_ride = (
        db.query(Ride)
        .filter(
            Ride.driver_id == driver.id,
            Ride.status.in_(["accepted", "ongoing"]),
        )
        .first()
    )

    if is_available and active_ride:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Complete your active ride before becoming available",
        )

    driver.is_available = is_available
    db.commit()
    db.refresh(driver)

    return {
        "message": "Availability updated",
        "is_available": driver.is_available,
    }


@router.get(
    "/available-rides",
    response_model=list[RideResponse],
)
def list_available_rides(
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    driver = get_driver(current_user, db)
    return find_available_rides(db, driver)


@router.post(
    "/rides/{ride_id}/accept",
    response_model=RideResponse,
)
def accept_ride(
    ride_id: int,
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    try:
        ride = (
            db.query(Ride)
            .filter(Ride.id == ride_id)
            .with_for_update()
            .first()
        )

        if not ride:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ride not found",
            )

        driver = (
            db.query(Driver)
            .filter(Driver.user_id == current_user.id)
            .with_for_update()
            .first()
        )

        if not driver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Register as a driver first",
            )

        if not driver.is_available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Set yourself available first",
            )

        if ride.status != "requested" or ride.driver_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This ride has already been taken",
            )

        ride.driver_id = driver.id
        ride.status = "accepted"
        driver.is_available = False

        db.commit()
        db.refresh(ride)

        return ride

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.patch(
    "/rides/{ride_id}/status",
    response_model=RideResponse,
)
def update_ride_status(
    ride_id: int,
    new_status: str,
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    try:
        driver = (
            db.query(Driver)
            .filter(Driver.user_id == current_user.id)
            .with_for_update()
            .first()
        )

        if not driver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Register as a driver first",
            )

        ride = (
            db.query(Ride)
            .filter(
                Ride.id == ride_id,
                Ride.driver_id == driver.id,
            )
            .with_for_update()
            .first()
        )

        if not ride:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ride assigned to you not found",
            )

        allowed_transitions = {
            "accepted": {"ongoing"},
            "ongoing": {"completed"},
        }

        if new_status not in allowed_transitions.get(
            ride.status, set()
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid ride status transition",
            )

        ride.status = new_status

        if new_status == "completed":
            # Temporary demo distance until map routing is integrated.
            demo_distance_km = Decimal("10")
            ride.fare = calculate_fare(demo_distance_km)
            driver.is_available = True

        db.commit()
        db.refresh(ride)

        return ride

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
