import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import Icon from "../components/Icon.jsx";

// readable names for the actions saved in the audit log
const actionLabels = {
  login: "Logged in",
  patient_created: "Created a patient",
  patient_updated: "Updated a patient",
  patient_deleted: "Deleted a patient",
  document_uploaded: "Uploaded a document",
  agent_get_patient: "AI assistant opened a patient",
  agent_get_document: "AI assistant read a document",
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Never";
}

// Admin only: one user, the patients they added and what they did recently
export default function UserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/auth/users/${id}/`).then(setData).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading...</p>;

  const { user, patients, activity } = data;

  return (
    <div>
      <Link to="/users" className="back-link"><Icon name="back" /> All users</Link>

      <div className="card">
        <div className="user-header">
          <span className={`avatar lg c${user.id % 5}`}>{(user.username?.[0] || "").toUpperCase()}</span>
          <div>
            <h2>{user.username}</h2>
            <span className={`pill ${user.role}`}>{user.role}</span>{" "}
            <span className={`pill ${user.is_active ? "active" : "disabled"}`}>
              {user.is_active ? "active" : "disabled"}
            </span>
          </div>
        </div>
        <div className="info-grid">
          <div className="info-item"><div className="k">Email</div><div className="v">{user.email || "-"}</div></div>
          <div className="info-item"><div className="k">Joined</div><div className="v">{formatDate(user.date_joined)}</div></div>
          <div className="info-item"><div className="k">Last login</div><div className="v">{formatDate(user.last_login)}</div></div>
          <div className="info-item"><div className="k">Last activity</div><div className="v">{formatDate(user.last_activity)}</div></div>
        </div>
      </div>

      <div className="stats">
        <div className="card stat">
          <span className="stat-icon teal"><Icon name="users" size={26} /></span>
          <div><p className="number">{user.patients_created}</p><p className="label">Patients added</p></div>
        </div>
        <div className="card stat">
          <span className="stat-icon blue"><Icon name="file" size={26} /></span>
          <div><p className="number">{user.documents_uploaded}</p><p className="label">Documents uploaded</p></div>
        </div>
      </div>

      <div className="section-title"><h3>Patients added by this user</h3></div>
      <div className="card table-wrap">
        {patients.length === 0 ? (
          <div className="empty">This user has not added any patients.</div>
        ) : (
          <table>
            <thead><tr><th>Patient</th><th>Gender</th><th>Added on</th></tr></thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/patients/${p.id}`}>{p.name}</Link></td>
                  <td><span className={`pill ${p.gender}`}>{p.gender}</span></td>
                  <td>{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="section-title"><h3>Recent activity</h3></div>
      <p className="admin-note">Shows the latest 50 actions. Only ids are stored, never patient details.</p>
      <div className="card">
        {activity.length === 0 ? (
          <div className="empty">No activity yet.</div>
        ) : (
          <ul className="timeline">
            {activity.map((a, i) => (
              <li key={i}>
                <span className="t-dot" />
                <div className="t-text">
                  <strong>{actionLabels[a.action] || a.action}</strong>
                  {a.object_id && a.object_type === "patient" && a.action !== "patient_deleted" ? (
                    <> - <Link to={`/patients/${a.object_id}`}>patient #{a.object_id}</Link></>
                  ) : (
                    a.object_id && a.object_type !== "user" && <> - {a.object_type} #{a.object_id}</>
                  )}
                  <div className="t-time">{formatDate(a.created_at)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
