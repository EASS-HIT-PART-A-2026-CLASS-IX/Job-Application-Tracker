import { useState } from "react";
import { API_BASE_URL } from "../constants";

export default function Register({ onGoToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Registration failed.");
      }
      setSuccess("Account created! Redirecting to sign in…");
      setUsername("");
      setPassword("");
      setTimeout(() => onGoToLogin(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-split">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo-mark">JF</div>
          <h2 className="auth-hero-title">Start tracking.<br />Stay ahead.</h2>
          <p className="auth-hero-sub">Create your free account and take control of your job search — from first application to final offer.</p>
          <div className="auth-stats">
            <div className="auth-stat"><span className="auth-stat-num">Free</span><span className="auth-stat-label">No credit card</span></div>
            <div className="auth-stat"><span className="auth-stat-num">AI</span><span className="auth-stat-label">Career advisor</span></div>
            <div className="auth-stat"><span className="auth-stat-num">∞</span><span className="auth-stat-label">Applications</span></div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card-v2">
          <div className="auth-card-header">
            <h1 className="auth-title-v2">Create account</h1>
            <p className="auth-subtitle-v2">Join JobFlow and organise your job search</p>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form-v2">
            <div className="auth-field">
              <label className="auth-label">Username</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="auth-btn-primary" type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account →"}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <button className="auth-link-v2" type="button" onClick={onGoToLogin}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
