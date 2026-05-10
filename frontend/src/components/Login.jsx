import { useState } from "react";
import { API_BASE_URL } from "../constants";

export default function Login({ onLogin, onGoToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Login failed.");
      }
      const { access_token } = await res.json();
      localStorage.setItem("jobflow-token", access_token);
      onLogin(access_token);
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
          <h2 className="auth-hero-title">Track every opportunity.<br />Land your dream job.</h2>
          <p className="auth-hero-sub">Manage applications, follow up on interviews, and stay on top of your job search — all in one place.</p>
          <div className="auth-stats">
            <div className="auth-stat"><span className="auth-stat-num">5</span><span className="auth-stat-label">Status stages</span></div>
            <div className="auth-stat"><span className="auth-stat-num">AI</span><span className="auth-stat-label">Career advisor</span></div>
            <div className="auth-stat"><span className="auth-stat-num">CSV</span><span className="auth-stat-label">Export anytime</span></div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card-v2">
          <div className="auth-card-header">
            <h1 className="auth-title-v2">Welcome back</h1>
            <p className="auth-subtitle-v2">Sign in to your JobFlow account</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form-v2">
            <div className="auth-field">
              <label className="auth-label">Username</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Enter your username"
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="auth-btn-primary" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account?{" "}
            <button className="auth-link-v2" type="button" onClick={onGoToRegister}>
              Create one free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
