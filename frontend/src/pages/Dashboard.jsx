import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getUser } from "../api";
import Icon from "../components/Icon.jsx";

export default function Dashboard() {
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/dashboard/").then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="muted">Loading...</p>;

  return (
    <div>
      <div className="hero-banner">
        <h2>Welcome, {user.username}</h2>
        <p>Here is a quick look at your patients and medical documents.</p>
        <div className="actions">
          <Link to="/patients/new" className="button light"><Icon name="plus" /> Add patient</Link>
          <Link to="/patients" className="button ghost"><Icon name="users" /> View patients</Link>
        </div>
      </div>

      <div className="stats">
        <div className="card stat">
          <span className="stat-icon teal"><Icon name="users" size={26} /></span>
          <div>
            <p className="number">{stats.total_patients}</p>
            <p className="label">Total patients</p>
          </div>
        </div>
        <div className="card stat">
          <span className="stat-icon blue"><Icon name="file" size={26} /></span>
          <div>
            <p className="number">{stats.total_documents}</p>
            <p className="label">Total documents</p>
          </div>
        </div>
      </div>

      <div className="section-title"><h3>Documents by processing status</h3></div>
      <div className="status-grid">
        {Object.entries(stats.documents_by_status).map(([status, count]) => {
          // how big this status is compared to all documents
          const percent = stats.total_documents ? (count / stats.total_documents) * 100 : 0;
          return (
            <div className="card status-card" key={status}>
              <div className="status-top">
                <span className={`dot ${status}`} />
                <span className="status-name">{status}</span>
                <span className="status-count">{count}</span>
              </div>
              <div className="bar"><div className={`bar-fill ${status}`} style={{ width: `${percent}%` }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
