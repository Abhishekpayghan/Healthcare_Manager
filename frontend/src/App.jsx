import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { getUser } from "./api";
import Icon from "./components/Icon.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PatientList from "./pages/PatientList.jsx";
import PatientForm from "./pages/PatientForm.jsx";
import PatientDetail from "./pages/PatientDetail.jsx";
import Assistant from "./agent/Assistant.jsx";
import Users from "./pages/Users.jsx";
import UserDetail from "./pages/UserDetail.jsx";

function Sidebar() {
  const navigate = useNavigate();
  const user = getUser();

  function logout() {
    localStorage.clear();
    navigate("/login");
  }

  // the link that matches the current page gets the "active" style
  const linkClass = ({ isActive }) => (isActive ? "side-link active" : "side-link");

  return (
    <aside className="sidebar">
      <Link to="/" className="brand">
        <span className="brand-icon"><Icon name="pulse" size={22} /></span>
        <span className="brand-text">Healthcare<small>Manager</small></span>
      </Link>

      <p className="side-label">Menu</p>
      <nav className="side-nav">
        <NavLink to="/" end className={linkClass}><Icon name="dashboard" /> Dashboard</NavLink>
        <NavLink to="/patients" end className={linkClass}><Icon name="users" /> Patients</NavLink>
        <NavLink to="/patients/new" className={linkClass}><Icon name="plus" /> Add patient</NavLink>
        <NavLink to="/assistant" className={linkClass}><Icon name="sparkle" /> AI Assistant</NavLink>
        {user.role === "admin" && (
          <NavLink to="/users" className={linkClass}><Icon name="user" /> Users</NavLink>
        )}
      </nav>

      <div className="side-user">
        <span className="user-avatar">{user.username[0]}</span>
        <div className="user-text">
          <strong>{user.username}</strong>
          <span>{user.role}</span>
        </div>
        <button className="icon-button" onClick={logout} title="Logout">
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}

// pages that need a logged in user
function RequireLogin({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" />;
}

// pages only an admin may open (the backend checks this again)
function RequireAdmin({ children }) {
  const user = getUser();
  if (!localStorage.getItem("token")) return <Navigate to="/login" />;
  return user && user.role === "admin" ? children : <Navigate to="/" />;
}

export default function App() {
  useLocation(); // makes this component refresh after login and logout
  const loggedIn = localStorage.getItem("token") && getUser();

  const routes = (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RequireLogin><Dashboard /></RequireLogin>} />
      <Route path="/patients" element={<RequireLogin><PatientList /></RequireLogin>} />
      <Route path="/patients/new" element={<RequireLogin><PatientForm /></RequireLogin>} />
      <Route path="/patients/:id" element={<RequireLogin><PatientDetail /></RequireLogin>} />
      <Route path="/patients/:id/edit" element={<RequireLogin><PatientForm /></RequireLogin>} />
      <Route path="/assistant" element={<RequireLogin><Assistant /></RequireLogin>} />
      <Route path="/users" element={<RequireAdmin><Users /></RequireAdmin>} />
      <Route path="/users/:id" element={<RequireAdmin><UserDetail /></RequireAdmin>} />
    </Routes>
  );

  // login and register pages are full screen, everything else has the sidebar
  if (!loggedIn) return routes;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content">{routes}</main>
    </div>
  );
}
