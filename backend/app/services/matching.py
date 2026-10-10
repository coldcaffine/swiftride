
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.ride import Ride


def get_available_rides(db: Session, driver: Driver) -> list[Ride]:
    """Return waiting rides for a driver who is currently available."""
    if not driver.is_available:
        return []

    return (
        db.query(Ride)
        .filter(
            Ride.status == "requested",
            Ride.driver_id.is_(None),
        )
        .order_by(Ride.created_at.asc(), Ride.id.asc())
        .all()
    )
