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
  const [showRegister, setShowRegister] = useState(false);

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
  };

  // JAB TAK LOGIN NAHI, TAB TAK DASHBOARD DIKHEGA HI NAHI
  if (!token) {
    return showRegister ? (
      <Register
        onRegisterSuccess={handleAuthSuccess}
        switchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <Login
        onLoginSuccess={handleAuthSuccess}
        switchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return <ExpenseDashboard user={user} onLogout={handleLogout} />;
};

export default App;
