import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Icon from "../components/Icon.jsx";

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");

  // load again whenever the search or filter changes
  useEffect(() => {
    api(`/patients/?search=${encodeURIComponent(search)}&gender=${gender}`)
      .then(setPatients)
      .catch((err) => setError(err.message));
  }, [search, gender]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Patients</h2>
          <p>{patients.length} record(s) shown</p>
        </div>
        <Link to="/patients/new" className="button"><Icon name="plus" /> Add patient</Link>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input placeholder="Search by name, phone or email" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="card table-wrap">
        {patients.length === 0 ? (
          <div className="empty"><Icon name="users" size={40} />No patients found.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Patient</th><th>Date of birth</th><th>Gender</th><th>Phone</th><th>Doctor</th></tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="person">
                      <span className={`avatar c${p.id % 5}`}>{(p.first_name?.[0] || "").toUpperCase()}{(p.last_name?.[0] || "").toUpperCase()}</span>
                      <Link to={`/patients/${p.id}`}>{p.first_name} {p.last_name}</Link>
                    </div>
                  </td>
                  <td>{p.date_of_birth}</td>
                  <td><span className={`pill ${p.gender}`}>{p.gender}</span></td>
                  <td>{p.phone || "-"}</td>
                  <td>{p.assigned_doctor_name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
