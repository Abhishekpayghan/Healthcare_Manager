import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import AuthLayout from "../components/AuthLayout.jsx";
import Icon from "../components/Icon.jsx";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "staff" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/register/", { method: "POST", body: JSON.stringify(form) });
      navigate("/login");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit}>
        <h2>Create account</h2>
        <p className="intro">Register as a doctor or as hospital staff.</p>
        {error && <p className="error"><Icon name="alert" /> {error}</p>}
        <label>Username
          <input name="username" value={form.username} onChange={handleChange} required autoFocus />
        </label>
        <label>Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <label>Role
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="staff">Staff</option>
            <option value="doctor">Doctor</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
        <p className="switch">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </AuthLayout>
  );
}
