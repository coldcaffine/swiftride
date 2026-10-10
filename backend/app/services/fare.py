
from decimal import Decimal, ROUND_HALF_UP

BASE_FARE = Decimal("40.00")
PER_KM_RATE = Decimal("15.00")
MINIMUM_FARE = Decimal("50.00")


def calculate_fare(distance_km: Decimal | float | int) -> Decimal:
    """Calculate a sample fare in INR from a known trip distance."""
    distance = Decimal(str(distance_km))

    if not distance.is_finite() or distance < 0:
        raise ValueError("Distance must be a finite, non-negative number")

    fare = max(MINIMUM_FARE, BASE_FARE + PER_KM_RATE * distance)

    return fare.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
