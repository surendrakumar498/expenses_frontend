import "../App.css";
import React, { useEffect, useState } from "react";
import { MoonLoader } from "react-spinners";

const UsersAdmin = ({ onBack }) => {
  const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/users`;

  const authHeader = () => {
    const token = sessionStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(API_URL, { headers: { ...authHeader() } });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to load users");
        return;
      }

      setUsers(data.users);
    } catch (err) {
      console.log(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${name}"? or Cancel to keep it.`);
    if (!confirmDelete) return;

    try {
      setDeletingId(id);

      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { ...authHeader() },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || `Failed to delete ${name}. Please try again.`);
        return;
      }

      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.log(err);
      alert("Something went wrong. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="users-admin-page">
      {loading && (
        <div className="loader-overlay">
          <div className="loader-circle">
            <MoonLoader size={55} color="#4a3aff" speedMultiplier={1} />
          </div>
        </div>
      )}

      <div className="users-admin-header">
        {onBack && (
          <span className="users-admin-back" onClick={onBack}>
            &larr; Back
          </span>
        )}
        <h2 className="users-admin-title">
          All Users <span className="users-admin-count">{users.length}</span>
        </h2>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {!loading && users.length === 0 && !error && (
        <div className="users-admin-empty">
          <p>Koi user nahi mila.</p>
        </div>
      )}

      <div className="users-admin-grid">
        {users.map((u, index) => (
          <div
            key={u._id}
            className="user-card"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="user-card-info">
              {u.profilePicture ? (
                <img src={u.profilePicture} alt={u.name} className="user-avatar" />
              ) : (
                <div className="user-avatar user-avatar-placeholder">
                  {u.name ? u.name.charAt(0).toUpperCase() : "👤"}
                </div>
              )}

              <div className="user-text">
                <p className="user-name">{u.name}</p>
                <p className="user-email">{u.email}</p>
              </div>
            </div>

            <button
              className="user-delete-btn"
              onClick={() => handleDelete(u._id, u.name)}
              disabled={deletingId === u._id}
            >
              {deletingId === u._id ? "Deleting..." : "Delete"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersAdmin;
