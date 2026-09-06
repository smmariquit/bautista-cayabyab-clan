// src/components/Header.tsx

"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
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
          <Link href="/" className="header-brand">
            <span className="header-title">Our Lineage</span>
            <span className="header-subtitle">The Domingo Bautista and Pastora Cayabyab Clan</span>
          </Link>

          <div className="header-right">
            <nav className="header-nav" aria-label="Primary navigation">
              <Link
                href="/"
                className={pathname === "/" ? "active" : ""}
                aria-current={pathname === "/" ? "page" : undefined}
              >
                Tree
              </Link>
              <Link
                href="/list"
                className={pathname === "/list" ? "active" : ""}
                aria-current={pathname === "/list" ? "page" : undefined}
              >
                List
              </Link>
            </nav>

            <div className="auth-btn-container">
              {isAuthenticated ? (
                <div className="user-indicator">
                  <span className="user-badge" title={`Logged in as ${user?.username}`}>
                    Editing as {user?.username}
                  </span>
                  <button className="auth-btn btn-logout" onClick={logout}>
                    Logout
                  </button>
                </div>
              ) : (
                <button className="auth-btn btn-login" onClick={() => setIsLoginOpen(true)}>
                  Editor log in
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="modal-overlay" onClick={() => setIsLoginOpen(false)}>
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setIsLoginOpen(false)} aria-label="Close login dialog">
              <span aria-hidden="true">✕</span>
            </button>
            <h2 className="modal-title" id="login-title">
              Clan Editor Login
            </h2>
            <p className="modal-desc">Log in to modify biographies, add family members, and manage relationships.</p>

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

              {errorMsg && (
                <div className="form-error" role="alert">
                  {errorMsg}
                </div>
              )}

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
