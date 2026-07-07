import "../App.css";
import React, { useState } from "react";
import { MoonLoader } from "react-spinners";

const ForgotPassword = ({ switchToLogin }) => {
  const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/auth`;

  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- STEP 1: Email submit -> OTP request ----------
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Email are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }
      setMessage(data.message);
      setStep(2);
    } catch (err) {
      console.log(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- STEP 2: OTP verify ----------
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Wrong OTP");
        return;
      }
      setMessage(data.message);
      setStep(3);
    } catch (err) {
      console.log(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- STEP 3: Reset password ----------
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Password don't match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }
      setMessage(data.message);
      setStep(4);
    } catch (err) {
      console.log(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {loading && (
        <div className="loader-overlay">
          <div className="loader-circle">
            <MoonLoader size={55} color="#4a3aff" speedMultiplier={1} />
          </div>
        </div>
      )}

      <div className="auth-card">
        <h2>Forgot Password</h2>

        {message && <p style={{ color: "green", fontSize: "14px" }}>{message}</p>}
        {error && <p className="auth-error">{error}</p>}

        {/* STEP 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Verifying OTP..." : "Verify OTP"}
            </button>
            <p className="auth-switch">
              <span onClick={() => setStep(1)}>Wrong email address? Go Back</span>
            </p>
          </form>
        )}

        {/* STEP 3: New password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="password-field-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Naya Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* STEP 4: Done */}
        {step === 4 && (
          <div>
            <p>Password Reset Successful!.</p>
            <button onClick={switchToLogin}>Go to Login Page</button>
          </div>
        )}

        {step !== 4 && (
          <p className="auth-switch">
            <span onClick={switchToLogin}>Back to Login</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
