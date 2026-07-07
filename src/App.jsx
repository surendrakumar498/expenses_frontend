import ForgotPassword from "./components/ForgotPassword";
import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import ExpenseDashboard from "./components/ExpenseDashboard";
import "./App.css";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // "login" | "register" | "forgot" — teeno mein se ek hi dikhega
  const [view, setView] = useState("login");

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setView("login");
  };

  // JAB TAK LOGIN NAHI, TAB TAK DASHBOARD DIKHEGA HI NAHI
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

  return <ExpenseDashboard user={user} onLogout={handleLogout} />;
};

export default App;