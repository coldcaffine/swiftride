import { useCallback, useEffect, useState } from "react";
import { MapPin, ArrowRight, RefreshCw, CarFront, Clock3 } from "lucide-react";
import api from "../api/client";

const badge = {
  requested: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  ongoing: "bg-violet-100 text-violet-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
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
      setError(e.response?.data?.detail || "Couldn't load rides. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRides(); }, [loadRides, refreshKey]);

  async function cancelRide(id) {
    const token = localStorage.getItem("token");
    setBusy(id);
    setMessage("");
    try {
      await api.patch(`/rides/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(`Ride #${id} cancelled.`);
      await loadRides();
    } catch (e) {
      setMessage(e.response?.data?.detail || "Could not cancel this ride.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section id="my-rides" className="w-full bg-slate-50 px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-indigo-600">Your journey</p>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">My Rides</h2>
            <p className="mt-2 text-slate-500">Your ride requests and their latest status.</p>
          </div>
          <button onClick={loadRides} disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold disabled:opacity-60">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""}/> Refresh
          </button>
        </div>

        {message && <p role="status" className="mb-4 rounded-xl bg-indigo-50 p-3 text-indigo-800">{message}</p>}
        {loading ? <p className="rounded-2xl bg-white p-8">Loading rides...</p> :
          error ? <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">{error}</p> :
          rides.length === 0 ? <p className="rounded-2xl bg-white p-8 text-slate-500">No rides yet. Book your first ride above.</p> :
          <div className="space-y-4">
            {rides.map(ride => (
              <article key={ride.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CarFront size={24} className="text-indigo-600"/>
                    <div>
                      <p className="font-bold text-slate-900">Ride #{ride.id}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Clock3 size={13}/>{ride.created_at ? new Date(ride.created_at).toLocaleString("en-IN") : "Date unavailable"}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${badge[ride.status] || "bg-slate-100 text-slate-700"}`}>
                    {ride.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <p className="break-words"><MapPin size={17} className="mr-2 inline text-emerald-600"/><strong>Pickup:</strong> {ride.pickup_location}</p>
                  <ArrowRight size={18} className="hidden text-slate-400 sm:block"/>
                  <p className="break-words"><MapPin size={17} className="mr-2 inline text-rose-500"/><strong>Destination:</strong> {ride.dropoff_location}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-slate-600">
                  <span>Driver: {ride.driver_id ?? "Not assigned"} · Fare: {ride.fare == null ? "Not set" : `₹${ride.fare}`}</span>
                  {["requested", "accepted"].includes(ride.status) && (
                    <button onClick={() => cancelRide(ride.id)} disabled={busy !== null}
                      className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                      {busy === ride.id ? "Cancelling..." : "Cancel ride"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        }
      </div>
    </section>
  );
}
