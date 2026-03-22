import { useState } from "react";
import { register } from "../api/auth";
import type { RegisterData } from "../api/auth";

interface Props {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const [form, setForm] = useState<RegisterData>({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      onSuccess?.();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const res = (err as { response?: { data?: unknown } }).response;
        const data = res?.data;
        if (data && typeof data === "object") {
          const messages = Object.values(data).flat().join(" ");
          setError(messages);
        } else {
          setError("Registration failed.");
        }
      } else {
        setError("Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "username", label: "Username", type: "text" },
    { name: "email", label: "Email", type: "email" },
    { name: "password", label: "Password", type: "password" },
    {
      name: "password2",
      label: "Confirm Password",
      type: "password",
    },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Create Account</h2>
      {error && <p className="login-error">{error}</p>}

      {fields.map(({ name, label, type }) => (
        <div className="form-group" key={name}>
          <label htmlFor={name}>{label}</label>
          <input
            id={name}
            name={name}
            type={type}
            value={form[name]}
            onChange={handleChange}
            required
          />
        </div>
      ))}

      <button type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Register"}
      </button>
    </form>
  );
}