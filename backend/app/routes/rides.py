
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import jwt

from app.database import get_db
from app.models.user import User
from app.models.driver import Driver
from app.models.ride import Ride
from app.schemas.ride import RideCreate, RideResponse
from app.core.security import decode_access_token


router = APIRouter(
    prefix="/rides",
    tags=["Rides"],
)

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


@router.post(
    "/",
    response_model=RideResponse,
    status_code=status.HTTP_201_CREATED,
)
def book_ride(
    ride_data: RideCreate,
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    ride = Ride(
        user_id=current_user.id,
        driver_id=None,
        pickup_location=ride_data.pickup_location.strip(),
        dropoff_location=ride_data.dropoff_location.strip(),
        status="requested",
        fare=None,
    )

    db.add(ride)

    try:
        db.commit()
        db.refresh(ride)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create ride",
        )

    return ride


@router.get(
    "/my-rides",
    response_model=list[RideResponse],
)
def get_my_rides(
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    rides = (
        db.query(Ride)
        .filter(Ride.user_id == current_user.id)
        .order_by(Ride.created_at.desc())
        .all()
    )

    return rides


@router.patch(
    "/{ride_id}/cancel",
    response_model=RideResponse,
)
def cancel_ride(
    ride_id: int,
    current_user: User = Depends(get_logged_in_user),
    db: Session = Depends(get_db),
):
    ride = (
        db.query(Ride)
        .filter(
            Ride.id == ride_id,
            Ride.user_id == current_user.id,
        )
        .with_for_update()
        .first()
    )

    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found",
        )

    if ride.status not in ("requested", "accepted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This ride cannot be cancelled",
        )

    try:
        if ride.driver_id is not None:
            driver = (
                db.query(Driver)
                .filter(Driver.id == ride.driver_id)
                .with_for_update()
                .first()
            )

            if driver:
                driver.is_available = True

        ride.status = "cancelled"

        db.commit()
        db.refresh(ride)

    except Exception:
        db.rollback()
        raise

    return ride
