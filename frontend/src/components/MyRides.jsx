import { useCallback, useEffect, useState } from "react";
import {
MapPin,
ArrowRight,
RefreshCw,
CarFront,
Clock3,
} from "lucide-react";
import api from "../api/client";

const badge = {
requested: "ride-status-requested",
accepted: "ride-status-accepted",
ongoing: "ride-status-ongoing",
completed: "ride-status-completed",
cancelled: "ride-status-cancelled",
};

export default function MyRides({ refreshKey = 0 }) {
const [rides, setRides] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [busy, setBusy] = useState(null);
const [message, setMessage] = useState("");

const loadRides = useCallback(async () => {
const token = localStorage.getItem("token");

if (!token) {
  setRides([]);
  setError("Please log in to see your rides.");
  setLoading(false);
  return;
}

setLoading(true);
setError("");

try {
  const { data } = await api.get("/rides/my-rides", {
    headers: { Authorization: `Bearer ${token}` },
  });

  setRides(Array.isArray(data) ? data : []);
} catch (e) {
  setError(
    e.response?.data?.detail ||
      "Couldn't load rides. Please refresh."
  );
} finally {
  setLoading(false);
}

}, []);

useEffect(() => {
loadRides();
}, [loadRides, refreshKey]);

async function cancelRide(id) {
const token = localStorage.getItem("token");
if (!token) return;

setBusy(id);
setMessage("");

try {
  await api.patch(
    `/rides/${id}/cancel`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  setMessage(`Ride #${id} cancelled.`);
  await loadRides();
} catch (e) {
  setMessage(
    e.response?.data?.detail ||
      "Could not cancel this ride."
  );
} finally {
  setBusy(null);
}

}

return ( <section id="my-rides" className="my-rides-section"> <div className="my-rides-container"> <div className="my-rides-header"> <div> <p className="my-rides-kicker">YOUR JOURNEY</p> <h2 className="my-rides-title">My Rides</h2> <p className="my-rides-subtitle">
Your ride requests and their latest status. </p> </div>

```
      <button
        type="button"
        onClick={loadRides}
        disabled={loading}
        className="rides-refresh-button"
      >
        <RefreshCw
          size={17}
          className={loading ? "animate-spin" : ""}
        />
        Refresh
      </button>
    </div>

    {message && (
      <p role="status" className="rides-message">
        {message}
      </p>
    )}

    {loading ? (
      <div className="rides-empty-state">
        Loading your rides...
      </div>
    ) : error ? (
      <div className="rides-error-state">
        <p>{error}</p>
        <button type="button" onClick={loadRides}>
          Try again
        </button>
      </div>
    ) : rides.length === 0 ? (
      <div className="rides-empty-state">
        <CarFront size={38} />
        <h3>No rides yet</h3>
        <p>Your booked rides will appear here.</p>
        <a href="#book">Book your first ride</a>
      </div>
    ) : (
      <>
        <p className="rides-count">
          {rides.length}{" "}
          {rides.length === 1 ? "ride" : "rides"} found
        </p>

        <div className="rides-list">
          {rides.map((ride) => (
            <article className="ride-card" key={ride.id}>
              <div className="ride-card-header">
                <div className="ride-card-identity">
                  <div className="ride-icon">
                    <CarFront size={23} />
                  </div>

                  <div>
                    <h3>Ride #{ride.id}</h3>
                    <p className="ride-date">
                      <Clock3 size={13} />
                      {ride.created_at
                        ? new Date(
                            ride.created_at
                          ).toLocaleString("en-IN")
                        : "Date unavailable"}
                    </p>
                  </div>
                </div>

                <span
                  className={`ride-status ${
                    badge[ride.status] || ""
                  }`}
                >
                  {(ride.status || "unknown").replaceAll(
                    "_",
                    " "
                  )}
                </span>
              </div>

              <div className="ride-route">
                <div className="ride-location">
                  <MapPin className="pickup-pin" size={19} />
                  <div>
                    <span>Pickup</span>
                    <p>{ride.pickup_location}</p>
                  </div>
                </div>

                <ArrowRight
                  className="ride-route-arrow"
                  size={20}
                />

                <div className="ride-location">
                  <MapPin className="destination-pin" size={19} />
                  <div>
                    <span>Destination</span>
                    <p>{ride.dropoff_location}</p>
                  </div>
                </div>
              </div>

              <div className="ride-card-footer">
                <p>
                  Driver:{" "}
                  <strong>
                    {ride.driver_id ?? "Not assigned"}
                  </strong>
                </p>
                <p>
                  Fare:{" "}
                  <strong>
                    {ride.fare == null
                      ? "Not available"
                      : `₹${ride.fare}`}
                  </strong>
                </p>

                {["requested", "accepted"].includes(
                  ride.status
                ) && (
                  <button
                    type="button"
                    className="cancel-ride-button"
                    onClick={() => cancelRide(ride.id)}
                    disabled={busy !== null}
                  >
                    {busy === ride.id
                      ? "Cancelling..."
                      : "Cancel ride"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </>
    )}
  </div>
</section>

);
}
