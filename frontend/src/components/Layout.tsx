import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <nav style={navStyle}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <strong style={{ fontSize: "1.2rem", color: "#646cff" }}>CareerPath</strong>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/jobs">Joburi</Link>
          <Link to="/profile">Profil</Link>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span>Salut, {username}!</span>
          <button onClick={handleLogout} style={{ padding: "0.4em 0.8em" }}>Logout</button>
        </div>
      </nav>
      
      {/* Aici se vor randa restul paginilor (Dashboard, Jobs etc.) */}
      <main style={{ padding: "2rem", maxWidth: "1280px", margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}

const navStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "1rem 2rem",
  backgroundColor: "#1a1a1a",
  borderBottom: "1px solid #333",
  alignItems: "center"
};