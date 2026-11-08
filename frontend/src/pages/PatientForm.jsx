import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import Icon from "../components/Icon.jsx";

const emptyForm = {
  first_name: "", last_name: "", date_of_birth: "", gender: "female",
  phone: "", email: "", address: "", assigned_doctor: "",
};

// This one form is used for both "add patient" and "edit patient"
export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/auth/doctors/").then(setDoctors);
    if (id) {
      api(`/patients/${id}/`).then((p) => setForm({ ...p, assigned_doctor: p.assigned_doctor || "" }));
    }
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const body = { ...form, assigned_doctor: form.assigned_doctor || null };
    try {
      const saved = await api(id ? `/patients/${id}/` : "/patients/", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      navigate(`/patients/${saved.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div>
      <Link to={id ? `/patients/${id}` : "/patients"} className="back-link">
        <Icon name="back" /> Back
      </Link>
      <div className="page-header">
        <div>
          <h2>{id ? "Edit patient" : "Add patient"}</h2>
          <p>Fill in the patient's basic details.</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        {error && <p className="error"><Icon name="alert" /> {error}</p>}

        <p className="form-section">Personal details</p>
        <div className="form-grid">
          <label>First name
            <input name="first_name" value={form.first_name} onChange={handleChange} required />
          </label>
          <label>Last name
            <input name="last_name" value={form.last_name} onChange={handleChange} required />
          </label>
          <label>Date of birth
            <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} required />
          </label>
          <label>Gender
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <p className="form-section">Contact</p>
        <div className="form-grid">
          <label>Phone
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label>Email
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>
          <label className="full">Address
            <textarea name="address" value={form.address} onChange={handleChange} />
          </label>
        </div>

        <p className="form-section">Care</p>
        <label>Assigned doctor
          <select name="assigned_doctor" value={form.assigned_doctor} onChange={handleChange}>
            <option value="">None</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.username}</option>)}
          </select>
        </label>

        <div className="form-footer">
          <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save patient"}</button>
          <Link to={id ? `/patients/${id}` : "/patients"} className="button secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
