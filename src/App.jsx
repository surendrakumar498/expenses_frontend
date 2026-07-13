import ForgotPassword from "./components/ForgotPassword";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import ExpenseDashboard from "./components/ExpenseDashboard";
import UsersAdmin from "./components/UsersAdmin";
import "./App.css";

const IDLE_TIMEOUT_MS = 5* 60 * 1000;

const App = () => {
  const [token, setToken] = useState(sessionStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [view, setView] = useState("login");

  const idleTimerRef = useRef(null);

  const handleAuthSuccess = (newToken, newUser) => {
    sessionStorage.setItem("token", newToken);
    sessionStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = useCallback(() => {
   sessionStorage.removeItem("token"); 
sessionStorage.removeItem("user");
    setToken("");
    setUser(null);
    setView("login");
  }, []);

  // ---------- IDLE / AUTO-LOGOUT LOGIC ----------
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (sessionStorage.getItem("token")) {
      idleTimerRef.current = setTimeout(() => {
        alert("Your session has expired due to inactivity. Please sign in again.")
        handleLogout();
      }, IDLE_TIMEOUT_MS);
    }
  }, [handleLogout]);

  useEffect(() => {
    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    const handleActivity = () => resetIdleTimer();

    activityEvents.forEach((event) => window.addEventListener(event, handleActivity));
    resetIdleTimer();

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer, token]);

  if (view === "users") {
    return <UsersAdmin onBack={() => setView("dashboard")} />;
  }

  if (!token) {
    if (view === "register") {
      return (
        <Register
          onRegisterSuccess={handleAuthSuccess}
          switchToLogin={() => setView("login")}
        />
      );
    }
    if (view === "forgot") {
      return <ForgotPassword switchToLogin={() => setView("login")} />;
    }

    return (
      <Login
        onLoginSuccess={handleAuthSuccess}
        switchToRegister={() => setView("register")}
        switchToForgot={() => setView("forgot")}
      />
    );
  }

  return (
    <ExpenseDashboard
      user={user}
      onLogout={handleLogout}
      onOpenUsers={() => setView("users")}
    />
  );
};

export default App;
