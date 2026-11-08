import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Icon from "../components/Icon.jsx";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Never";
}

// Admin only: list of every user with a few numbers about their work
export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/auth/users/?search=${encodeURIComponent(search)}&role=${role}`)
      .then(setUsers)
      .catch((err) => setError(err.message));
  }, [search, role]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Users</h2>
          <p>{users.length} user(s). Only admins can see this page.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input placeholder="Search by username or email" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="doctor">Doctor</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="card table-wrap">
        {users.length === 0 ? (
          <div className="empty"><Icon name="user" size={40} />No users found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th><th>Role</th><th>Patients added</th>
                <th>Documents uploaded</th><th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="person">
                      <span className={`avatar c${u.id % 5}`}>{(u.username?.[0] || "").toUpperCase()}</span>
                      <div>
                        <Link to={`/users/${u.id}`}>{u.username}</Link>
                        <span className="sub">{u.email || "no email"}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className={`pill ${u.role}`}>{u.role}</span></td>
                  <td>{u.patients_created}</td>
                  <td>{u.documents_uploaded}</td>
                  <td>{formatDate(u.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
