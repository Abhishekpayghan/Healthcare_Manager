import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import AuthLayout from "../components/AuthLayout.jsx";
import Icon from "../components/Icon.jsx";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
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
      const data = await api("/auth/login/", { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit}>
        <h2>Welcome back</h2>
        <p className="intro">Log in to manage patients and documents.</p>
        {error && <p className="error"><Icon name="alert" /> {error}</p>}
        <label>Username
          <input name="username" value={form.username} onChange={handleChange} required autoFocus />
        </label>
        <label>Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        <p className="switch">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </AuthLayout>
  );
}
