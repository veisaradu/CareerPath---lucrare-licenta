import { useNavigate, Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="page-center">
      <LoginForm onSuccess={() => navigate("/dashboard")} />
      <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}