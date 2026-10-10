import { useState } from "react";
import { X, Navigation, ArrowRight, Eye, EyeOff } from "lucide-react";
import api from "../api/client";

export default function AuthModal({ onClose, onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (mode === "register") {
        await api.post("/auth/register", {
          name: name.trim(),
          email: cleanEmail,
          password,
        });
      }

      const response = await api.post("/auth/login", {
        email: cleanEmail,
        password,
      });

      const token = response.data.access_token;

      if (!token) {
        throw new Error("The server did not return an access token.");
      }

      localStorage.setItem("token", token);
      onLogin();
      onClose();
    } catch (error) {
      const detail = error.response?.data?.detail;

      setMessage(
        typeof detail === "string"
          ? detail
          : error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="auth-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button
          type="button"
          className="auth-close"
          onClick={onClose}
          aria-label="Close authentication"
          disabled={loading}
        >
          <X size={21} />
        </button>

        <div className="auth-brand">
          <span className="brand-icon">
            <Navigation size={21} />
          </span>
          <span>
            swift<span className="brand-accent">ride</span>
          </span>
        </div>

        <p className="auth-eyebrow">YOUR NEXT JOURNEY STARTS HERE</p>

        <h2 id="auth-title">
          {mode === "login" ? "Welcome back." : "Create your account."}
        </h2>

        <p className="auth-subtitle">
          {mode === "login"
            ? "Log in to book rides and see your ride history."
            : "Sign up to get started with SwiftRide."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Full name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                minLength={2}
                maxLength={100}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <span className="auth-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  mode === "register"
                    ? "At least 8 characters"
                    : "Enter your password"
                }
                minLength={mode === "register" ? 8 : 1}
                maxLength={128}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {message && (
            <p className="auth-error" role="alert">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log in"
                : "Create account"}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login"
            ? "New to SwiftRide?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode((value) =>
                value === "login" ? "register" : "login"
              );
              setMessage("");
            }}
          >
            {mode === "login" ? "Create account" : "Log in"}
          </button>
        </p>

        <p className="auth-security">
          Your account is connected to the SwiftRide authentication service.
        </p>
      </section>
    </div>
  );
}
