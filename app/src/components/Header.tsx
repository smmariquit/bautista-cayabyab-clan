"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function Header() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const pathname = usePathname();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await login(usernameInput, passwordInput);
      if (res.success) {
        setIsLoginOpen(false);
        setUsernameInput("");
        setPasswordInput("");
      } else {
        setErrorMsg(res.error || "Invalid username or password");
      }
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <a href="/" className="header-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L12 8" />
              <path d="M12 8C12 8 8 10 6 14" />
              <path d="M12 8C12 8 16 10 18 14" />
              <path d="M6 14C6 14 4 18 5 22" />
              <path d="M18 14C18 14 20 18 19 22" />
              <path d="M12 8C12 8 12 14 12 22" />
              <circle cx="12" cy="2" r="1" fill="currentColor" />
            </svg>
            <div>
              <div className="header-title">Our Lineage</div>
              <div className="header-subtitle">Bautista–Cayabyab Clan</div>
            </div>
          </a>

          <div className="header-right">
            <nav className="header-nav">
              <a href="/" className={pathname === "/" ? "active" : ""}>
                Tree
              </a>
              <a href="/list" className={pathname === "/list" ? "active" : ""}>
                List
              </a>
            </nav>

            <div className="auth-btn-container">
              {isAuthenticated ? (
                <div className="user-indicator">
                  <span className="user-badge" title={`Logged in as ${user?.username}`}>
                    ✍️ {user?.username}
                  </span>
                  <button className="auth-btn btn-logout" onClick={logout}>
                    Logout
                  </button>
                </div>
              ) : (
                <button className="auth-btn btn-login" onClick={() => setIsLoginOpen(true)}>
                  Editor Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="modal-overlay" onClick={() => setIsLoginOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsLoginOpen(false)}>
              ✕
            </button>
            <h2 className="modal-title">Clan Editor Login</h2>
            <p className="modal-desc">
              Log in to modify biographies, add family members, and manage relationships.
            </p>

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  className="form-input"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. admin"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Password"
                  disabled={isSubmitting}
                />
              </div>

              {errorMsg && <div className="form-error">{errorMsg}</div>}

              <button type="submit" className="form-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Log In"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
