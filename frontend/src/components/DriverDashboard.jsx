import { useCallback, useEffect, useState } from "react";
import { CarFront, RefreshCw, UserRound } from "lucide-react";
import api from "../api/client";

export default function DriverDashboard() {
  const [profile, setProfile] = useState(null);
  const [rides, setRides] = useState([]);
  const [form, setForm] = useState({
    license_number: "", vehicle_make: "", vehicle_model: "", vehicle_plate: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const token = () => localStorage.getItem("token");
  const config = () => ({ headers: { Authorization: `Bearer ${token()}` } });

  const refresh = useCallback(async () => {
    if (!token()) {
      setMessage("Log in with a valid token to use the driver dashboard.");
      return;
    }
    try {
      const { data } = await api.get("/drivers/me", config());
      setProfile(data);
      const available = await api.get("/drivers/available-rides", config());
      setRides(available.data);
      setMessage("");
    } catch (e) {
      if (e.response?.status === 404) {
        setProfile(null);
      } else {
        setMessage(e.response?.data?.detail || "Could not load driver dashboard.");
      }
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function register(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await api.post("/drivers/register", form, config());
      setMessage("Driver profile created!");
      await refresh();
    } catch (e) {
      setMessage(e.response?.data?.detail || "Driver registration failed.");
    } finally {
      setBusy(false);
    }
  }

  async function availability(value) {
    setBusy(true);
    try {
      await api.patch(`/drivers/availability?is_available=${value}`, {}, config());
      await refresh();
      setMessage(value ? "You are now available for rides." : "You are now unavailable.");
    } catch (e) {
      setMessage(e.response?.data?.detail || "Could not update availability.");
    } finally {
      setBusy(false);
    }
  }

  async function accept(id) {
    setBusy(true);
    setMessage("");
    try {
      await api.post(`/drivers/rides/${id}/accept`, {}, config());
      setMessage(`Ride #${id} accepted!`);
      await refresh();
    } catch (e) {
      setMessage(e.response?.data?.detail || "Could not accept this ride.");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(id, value) {
    setBusy(true);
    setMessage("");
    try {
      await api.patch(`/drivers/rides/${id}/status?new_status=${value}`, {}, config());
      setMessage(`Ride #${id} marked ${value}.`);
      await refresh();
    } catch (e) {
      setMessage(e.response?.data?.detail || "Could not update ride.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="driver-dashboard" className="bg-white px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-indigo-600">For drivers</p>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl font-extrabold text-slate-900">Driver Dashboard</h2>
          <button onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-semibold">
            <RefreshCw size={16}/> Refresh
          </button>
        </div>

        {message && <p role="status" className="mb-5 rounded-xl bg-indigo-50 p-3 text-indigo-800">{message}</p>}

        {!profile ? (
          <form onSubmit={register} className="grid gap-4 rounded-2xl border p-5 sm:grid-cols-2">
            <h3 className="sm:col-span-2 text-xl font-bold">Register as a driver</h3>
            {[
              ["license_number", "License number"],
              ["vehicle_make", "Vehicle make"],
              ["vehicle_model", "Vehicle model"],
              ["vehicle_plate", "Vehicle plate"],
            ].map(([key, label]) => (
              <label key={key} className="grid gap-1 text-sm font-semibold text-slate-700">
                {label}
                <input required minLength={key === "vehicle_make" || key === "vehicle_model" ? 1 : 3}
                  value={form[key]} onChange={e => setForm(old => ({ ...old, [key]: e.target.value }))}
                  className="rounded-lg border p-3 font-normal" />
              </label>
            ))}
            <button disabled={busy} className="rounded-xl bg-indigo-600 p-3 font-bold text-white disabled:opacity-60 sm:col-span-2">
              {busy ? "Saving..." : "Register driver"}
            </button>
          </form>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5">
              <div className="flex items-center gap-3">
                <UserRound size={28} className="text-indigo-600"/>
                <div>
                  <h3 className="font-bold">{profile.vehicle_make} {profile.vehicle_model}</h3>
                  <p className="text-sm text-slate-500">Vehicle: {profile.vehicle_plate}</p>
                  <p className="text-sm text-slate-500">Status: {profile.is_available ? "Available" : "Unavailable"}</p>
                </div>
              </div>
              <button disabled={busy} onClick={() => availability(!profile.is_available)}
                className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:opacity-60">
                {profile.is_available ? "Go unavailable" : "Go available"}
              </button>
            </div>

            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold"><CarFront/> Available ride requests</h3>
            {!profile.is_available ? <p className="rounded-xl bg-slate-50 p-5 text-slate-600">Switch to available to see ride requests.</p> :
              rides.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-slate-600">No unassigned ride requests right now. Refresh in a moment.</p> :
              <div className="space-y-4">
                {rides.map(ride => (
                  <article key={ride.id} className="rounded-2xl border p-5">
                    <div className="mb-3 flex flex-wrap justify-between gap-2">
                      <strong>Ride #{ride.id}</strong><span className="text-sm capitalize text-amber-700">{ride.status}</span>
                    </div>
                    <p>Pickup: <strong>{ride.pickup_location}</strong></p>
                    <p className="mb-4">Destination: <strong>{ride.dropoff_location}</strong></p>
                    <button disabled={busy} onClick={() => accept(ride.id)}
                      className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white disabled:opacity-60">Accept ride</button>
                  </article>
                ))}
              </div>
            }
          </>
        )}

        {profile && (
          <DriverAssignedRides
            key={profile.id}
            token={token()}
            busy={busy}
            onStatus={updateStatus}
          />
        )}
      </div>
    </section>
  );
}

function DriverAssignedRides({ token, busy, onStatus }) {
  const [assigned, setAssigned] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/drivers/me/assigned-rides", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssigned(data);
      setError("");
    } catch (e) {
      setError(e.response?.data?.detail || "Could not load assigned rides.");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold">My assigned rides</h3>
        <button onClick={load} className="rounded-lg border px-3 py-2 text-sm font-semibold">Refresh</button>
      </div>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      {assigned.map(ride => (
        <article key={ride.id} className="mb-3 rounded-xl border p-4">
          <p className="font-bold">Ride #{ride.id} · <span className="capitalize">{ride.status}</span></p>
          <p className="mt-2">{ride.pickup_location} → {ride.dropoff_location}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ride.status === "accepted" && <button disabled={busy} onClick={async () => { await onStatus(ride.id, "ongoing"); await load(); }} className="rounded-lg bg-violet-600 px-3 py-2 text-white">Start ride</button>}
            {ride.status === "ongoing" && <button disabled={busy} onClick={async () => { await onStatus(ride.id, "completed"); await load(); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-white">Complete ride</button>}
          </div>
        </article>
      ))}
      {assigned.length === 0 && !error && <p className="text-slate-500">No assigned rides yet.</p>}
    </div>
  );
}
