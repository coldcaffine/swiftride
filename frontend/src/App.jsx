
import { useState } from "react";
import {
  Navigation,
  ArrowRight,
  ShieldCheck,
  MapPin,
  CarFront,
  Clock,
  Zap,
  Menu,
} from "lucide-react";

import api from "./api/client";
import MyRides from "./components/MyRides";
import DriverDashboard from "./components/DriverDashboard";
import AuthModal from "./components/AuthModal";

export default function App() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshRides, setRefreshRides] = useState(0);

  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token"))
  );
  const [authNotice, setAuthNotice] = useState("");

  async function handleBookRide(event) {
    event.preventDefault();
    setBookingMessage("");
    setBookingSuccess(false);
    setAuthNotice("");

    const token = localStorage.getItem("token");

    if (!token) {
      setBookingMessage("Please log in first to book a ride.");
      setAuthOpen(true);
      return;
    }

    if (!pickup.trim() || !destination.trim()) {
      setBookingMessage("Please enter both locations.");
      return;
    }

    setBookingLoading(true);

    try {
      const response = await api.post(
        "/rides/",
        {
          pickup_location: pickup.trim(),
          dropoff_location: destination.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookingSuccess(true);
      setBookingMessage(
        `Ride request created successfully! Your ride ID is ${response.data.id}.`
      );

      setPickup("");
      setDestination("");
      setRefreshRides((value) => value + 1);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setBookingMessage("Your session expired. Please log in again.");
        setAuthOpen(true);
      } else {
        setBookingMessage(
          error.response?.data?.detail ||
          "Unable to book your ride. Please try again."
        );
      }
    } finally {
      setBookingLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setAuthNotice("You have been logged out.");
    setBookingMessage("");
  }

  function handleLogin() {
    setIsLoggedIn(true);
    setAuthNotice("You're logged in! You can now book a ride.");
    setBookingMessage("");
    setBookingSuccess(false);
    setRefreshRides((value) => value + 1);
  }

  return (
    <div className="app-shell">
      <nav className="navbar">
        <a
          className="brand"
          href="#home"
          onClick={() => setMenuOpen(false)}
        >
          <span className="brand-icon">
            <Navigation size={21} />
          </span>
          <span>
            swift<span className="brand-accent">ride</span>
          </span>
        </a>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <Menu />
        </button>

        <div className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#book" onClick={() => setMenuOpen(false)}>Book a ride</a>
          <a href="#my-rides" onClick={() => setMenuOpen(false)}>My rides</a>
          <a href="#driver-dashboard" onClick={() => setMenuOpen(false)}>For drivers</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Why SwiftRide</a>

          <div className="mobile-auth-link">
            {isLoggedIn ? (
              <button onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}>
                Log out
              </button>
            ) : (
              <button onClick={() => {
                setAuthOpen(true);
                setMenuOpen(false);
              }}>
                Log in / Sign up
              </button>
            )}
          </div>
        </div>

        <div className="nav-auth-actions">
          {isLoggedIn ? (
            <button className="nav-login-button" onClick={handleLogout}>
              Log out
            </button>
          ) : (
            <button
              className="nav-login-button"
              onClick={() => setAuthOpen(true)}
            >
              Log in
            </button>
          )}

          <a
            className="nav-cta"
            href="#book"
            onClick={() => setMenuOpen(false)}
          >
            Get a ride <ArrowRight size={16} />
          </a>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" />
              YOUR CITY. YOUR RIDE.
            </div>

            <h1>
              Every journey
              <br />
              starts with <span>you.</span>
            </h1>

            <p className="hero-description">
              Your plans don't wait. Get where you need to be with a ride
              that's simple, reliable, and made for your day.
            </p>

            <div className="hero-actions">
              <a href="#book" className="primary-button">
                Book your ride <ArrowRight size={18} />
              </a>
              <div className="trust-note">
                <ShieldCheck size={18} />
                Simple. Reliable. Yours.
              </div>
            </div>

            <div className="hero-stats">
              <div>
                <strong>24/7</strong>
                <span>Ride requests</span>
              </div>
              <div className="stat-divider" />
              <div>
                <strong>Easy</strong>
                <span>Booking process</span>
              </div>
              <div className="stat-divider" />
              <div>
                <strong>One tap</strong>
                <span>Closer to there</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow" />

            <div className="map-card">
              <div className="map-topline">
                <span>YOUR NEXT JOURNEY</span>
                <span className="map-live">
                  <span className="live-dot" />
                  LIVE CONCEPT
                </span>
              </div>

              <div className="map-art">
                <div className="map-road road-one" />
                <div className="map-road road-two" />
                <div className="map-road road-three" />
                <div className="map-road road-four" />

                <div className="map-block block-one" />
                <div className="map-block block-two" />
                <div className="map-block block-three" />
                <div className="map-block block-four" />

                <div className="route-line" />

                <div className="map-pin pickup-pin">
                  <MapPin size={18} />
                </div>
                <div className="map-pin destination-pin">
                  <Navigation size={17} />
                </div>
                <div className="car-marker">
                  <CarFront size={27} />
                </div>

                <div className="map-label label-pickup">Pickup point</div>
                <div className="map-label label-destination">
                  Your destination
                </div>
              </div>

              <div className="trip-preview">
                <div className="trip-car">
                  <CarFront size={25} />
                </div>
                <div className="trip-info">
                  <strong>Your ride, your way</strong>
                  <span>Book in just a few steps</span>
                </div>
                <div className="trip-time">
                  <Clock size={14} />
                  Easy
                </div>
              </div>
            </div>

            <div className="floating-tag">
              <span className="floating-icon">
                <Zap size={17} />
              </span>
              <div>
                <strong>Ready when you are</strong>
                <small>Your next trip starts here</small>
              </div>
            </div>
          </div>
        </section>

        <section className="booking-section" id="book">
          <div className="booking-heading">
            <span className="section-kicker">LET'S GET YOU THERE</span>
            <h2>Where are we going?</h2>
            <p>Enter your locations to start planning your ride.</p>
          </div>

          {authNotice && (
            <p className="auth-notice" role="status">
              {authNotice}
            </p>
          )}

          <form className="booking-card" onSubmit={handleBookRide}>
            <div className="location-fields">
              <label className="location-field">
                <span className="field-icon pickup-icon">
                  <MapPin size={19} />
                </span>
                <span className="field-content">
                  <span>Pickup location</span>
                  <input
                    value={pickup}
                    onChange={(event) => setPickup(event.target.value)}
                    placeholder="Where should we pick you up?"
                    required
                  />
                </span>
              </label>

              <div className="location-connector">
                <span />
              </div>

              <label className="location-field">
                <span className="field-icon destination-icon">
                  <Navigation size={18} />
                </span>
                <span className="field-content">
                  <span>Destination</span>
                  <input
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder="Where are you headed?"
                    required
                  />
                </span>
              </label>
            </div>

            <button
              className="book-button"
              type="submit"
              disabled={bookingLoading}
            >
              {bookingLoading ? "Booking..." : "Find my ride"}
              <ArrowRight size={18} />
            </button>

            {bookingMessage && (
              <p
                className={
                  bookingSuccess ? "booking-success" : "booking-error"
                }
                role="status"
                aria-live="polite"
              >
                {bookingMessage}
              </p>
            )}
          </form>

          <p className="booking-disclaimer">
            Ride requests are submitted to the SwiftRide booking service.
          </p>
        </section>

        <div id="my-rides">
          <MyRides key={refreshRides} />
        </div>

        <div id="driver-dashboard">
          <DriverDashboard />
        </div>

        <section className="features-section" id="features">
          <div className="features-heading">
            <span className="section-kicker">THE SWIFTRIDE DIFFERENCE</span>
            <h2>
              Less hassle. More <span>journey.</span>
            </h2>
          </div>

          <div className="features-grid">
            <article className="feature-card">
              <span className="feature-icon">
                <Zap size={22} />
              </span>
              <h3>Simple booking</h3>
              <p>
                Enter your pickup and destination and get your ride request
                started without the fuss.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-icon">
                <ShieldCheck size={22} />
              </span>
              <h3>Your account, your rides</h3>
              <p>
                Sign in securely and access your personal ride history.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-icon">
                <Clock size={22} />
              </span>
              <h3>Stay in the loop</h3>
              <p>
                Keep track of your ride requests and check their status from
                one place.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">
            <Navigation size={18} />
          </span>
          <span>
            swift<span className="brand-accent">ride</span>
          </span>
        </a>
        <span>Built for the journeys that make your day.</span>
        <span>© 2026 SwiftRide</span>
      </footer>

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}
