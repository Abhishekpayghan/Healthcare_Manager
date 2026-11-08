import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, getUser } from "../api";
import DocumentUpload from "../components/DocumentUpload.jsx";
import DocumentCard from "../components/DocumentCard.jsx";
import Icon from "../components/Icon.jsx";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [patient, setPatient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");

  function loadDocuments() {
    api(`/documents/?patient=${id}`).then(setDocuments).catch((err) => setError(err.message));
  }

  useEffect(() => {
    api(`/patients/${id}/`).then(setPatient).catch((err) => setError(err.message));
    loadDocuments();
  }, [id]);

  // while a document is still being processed, check again every 3 seconds
  useEffect(() => {
    const busy = documents.some((d) => d.status === "pending" || d.status === "processing");
    if (!busy) return;
    const timer = setInterval(loadDocuments, 3000);
    return () => clearInterval(timer);
  }, [documents]);

  async function handleDelete() {
    if (!window.confirm("Delete this patient and all their documents?")) return;
    try {
      await api(`/patients/${id}/`, { method: "DELETE" });
      navigate("/patients");
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !patient) return <p className="error">{error}</p>;
  if (!patient) return <p className="muted">Loading...</p>;

  return (
    <div>
      <Link to="/patients" className="back-link"><Icon name="back" /> All patients</Link>

      <div className="card profile">
        <div className="profile-cover" />
        <div className="profile-body">
          <div className="profile-top">
            <span className={`avatar big c${patient.id % 5}`}>{(patient.first_name?.[0] || "").toUpperCase()}{(patient.last_name?.[0] || "").toUpperCase()}</span>
            <div className="profile-name">
              <h2>{patient.first_name} {patient.last_name}</h2>
              <span className={`pill ${patient.gender}`}>{patient.gender}</span>
            </div>
            <div className="actions">
              <Link to={`/patients/${id}/edit`} className="button secondary"><Icon name="edit" /> Edit</Link>
              {user.role === "admin" && (
                <button className="danger" onClick={handleDelete}><Icon name="trash" /> Delete</button>
              )}
            </div>
          </div>

          {error && <p className="error" style={{ marginTop: 16 }}>{error}</p>}

          <div className="info-grid">
            <div className="info-item"><div className="k">Date of birth</div><div className="v">{patient.date_of_birth}</div></div>
            <div className="info-item"><div className="k">Phone</div><div className="v">{patient.phone || "-"}</div></div>
            <div className="info-item"><div className="k">Email</div><div className="v">{patient.email || "-"}</div></div>
            <div className="info-item"><div className="k">Assigned doctor</div><div className="v">{patient.assigned_doctor_name || "-"}</div></div>
            <div className="info-item"><div className="k">Address</div><div className="v">{patient.address || "-"}</div></div>
          </div>
        </div>
      </div>

      <div className="section-title">
        <h3>Medical documents ({documents.length})</h3>
      </div>
      <DocumentUpload patientId={id} onUploaded={loadDocuments} />
      {documents.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
      {documents.length === 0 && (
        <div className="card empty"><Icon name="file" size={40} />No documents uploaded yet.</div>
      )}
    </div>
  );
}
