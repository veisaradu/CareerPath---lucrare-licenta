import { useEffect, useState } from "react";
import {
  getMyAccount,
  updateProfile,
  getMySkills,
  getAllSkills,
  addSkill,
  deleteSkill,
  getMyCVs,
  uploadCV,
  deleteCV,
  type UserAccount,
  type UserSkillProficiency,
  type Skill,
  type CV,
} from "../api/users";

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Începător" },
  { value: "intermediate", label: "Intermediar" },
  { value: "advanced", label: "Avansat" },
  { value: "expert", label: "Expert" },
] as const;

export default function ProfilePage() {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [skills, setSkills] = useState<UserSkillProficiency[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [cvs, setCVs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMyAccount(), getMySkills(), getAllSkills(), getMyCVs()])
      .then(([acc, sk, all, cv]) => {
        setAccount(acc);
        setSkills(sk);
        setAllSkills(all);
        setCVs(cv);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Se încarcă profilul...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  // Dacă account există dar profile e null, afișăm eroare clară
  if (!account) return <p style={{ color: "red" }}>Nu s-a putut încărca contul.</p>;
  if (!account.profile) return <p style={{ color: "red" }}>Profilul nu există. Contactează administratorul.</p>;

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <h1 style={{ margin: 0 }}>Profilul meu</h1>

      <ProfileInfoSection
        account={account}
        onSaved={(updated) =>
          setAccount((prev) =>
            prev ? { ...prev, profile: updated } : prev
          )
        }
      />

      <SkillsSection
        skills={skills}
        allSkills={allSkills}
        onAdd={(s) => setSkills((prev) => [...prev, s])}
        onDelete={(id) => setSkills((prev) => prev.filter((s) => s.id !== id))}
      />

      <CVSection
        cvs={cvs}
        onUploaded={(cv) => setCVs((prev) => [...prev, cv])}
        onDeleted={(id) => setCVs((prev) => prev.filter((c) => c.id !== id))}
      />
    </div>
  );
}

// ─── Profile Info ─────────────────────────────────────────────

function ProfileInfoSection({
  account,
  onSaved,
}: {
  account: UserAccount;
  onSaved: (p: UserAccount["profile"]) => void;
}) {
  const p = account.profile;
  const [form, setForm] = useState({
    education_level: p.education_level ?? "",
    interests: p.interests ?? "",
    experience_years: p.experience_years ?? 0,
    desired_role: p.desired_role ?? "",
    location: p.location ?? "",
    open_to_remote: p.open_to_remote ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateProfile(form);
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Informații profil">
      <div
        style={{ marginBottom: "1rem", color: "#aaa", fontSize: "0.9rem" }}
      >
        <strong style={{ color: "#fff" }}>{account.username}</strong> ·{" "}
        {account.email}
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <Field label="Rol dorit">
          <input
            name="desired_role"
            value={form.desired_role}
            onChange={handleChange}
            placeholder="ex: Backend Developer"
          />
        </Field>
        <Field label="Nivel educație">
          <input
            name="education_level"
            value={form.education_level}
            onChange={handleChange}
            placeholder="ex: Bachelor's in CS"
          />
        </Field>
        <Field label="Locație">
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="ex: București"
          />
        </Field>
        <Field label="Ani experiență">
          <input
            name="experience_years"
            type="number"
            min={0}
            value={form.experience_years}
            onChange={handleChange}
          />
        </Field>
        <Field label="Interese" style={{ gridColumn: "1 / -1" }}>
          <textarea
            name="interests"
            value={form.interests}
            onChange={handleChange}
            rows={3}
            placeholder="ex: AI, Web Development, Open Source..."
          />
        </Field>
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <input
            id="open_to_remote"
            name="open_to_remote"
            type="checkbox"
            checked={form.open_to_remote}
            onChange={handleChange}
          />
          <label htmlFor="open_to_remote">Deschis la remote</label>
        </div>
        {saveError && (
          <p style={{ gridColumn: "1 / -1", color: "red", margin: 0 }}>
            {saveError}
          </p>
        )}
        <div style={{ gridColumn: "1 / -1" }}>
          <button type="submit" disabled={saving}>
            {saving ? "Se salvează..." : saved ? "✓ Salvat!" : "Salvează"}
          </button>
        </div>
      </form>
    </Card>
  );
}

// ─── Skills ───────────────────────────────────────────────────

function SkillsSection({
  skills,
  allSkills,
  onAdd,
  onDelete,
}: {
  skills: UserSkillProficiency[];
  allSkills: Skill[];
  onAdd: (s: UserSkillProficiency) => void;
  onDelete: (id: number) => void;
}) {
  const [selectedSkill, setSelectedSkill] = useState("");
  const [level, setLevel] =
    useState<UserSkillProficiency["level"]>("beginner");
  const [years, setYears] = useState(0);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usedSkillIds = new Set(skills.map((s) => s.skill));
  const available = allSkills.filter((s) => !usedSkillIds.has(s.id));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill) return;
    setAdding(true);
    setError(null);
    try {
      const created = await addSkill({
        skill: Number(selectedSkill),
        level,
        years_experience: years,
      });
      onAdd(created);
      setSelectedSkill("");
      setYears(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card title="Skilluri">
      {skills.length === 0 ? (
        <p style={{ color: "#aaa" }}>Nu ai adăugat skilluri încă.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {skills.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.3rem 0.7rem",
                border: "1px solid #444",
                borderRadius: "20px",
                fontSize: "0.85rem",
              }}
            >
              <span>{s.skill_name}</span>
              <span style={{ color: "#aaa" }}>· {s.level}</span>
              <button
                onClick={() => deleteSkill(s.id).then(() => onDelete(s.id))}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ff6b6b",
                  cursor: "pointer",
                  padding: "0 2px",
                  fontSize: "1rem",
                  lineHeight: 1,
                }}
                title="Șterge"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleAdd}
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <Field label="Skill">
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            required
          >
            <option value="">Alege skill...</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nivel">
          <select
            value={level}
            onChange={(e) =>
              setLevel(e.target.value as UserSkillProficiency["level"])
            }
          >
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ani exp.">
          <input
            type="number"
            min={0}
            step={0.5}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            style={{ width: "80px" }}
          />
        </Field>
        <button
          type="submit"
          disabled={adding}
          style={{ marginBottom: "0px" }}
        >
          {adding ? "..." : "+ Adaugă"}
        </button>
      </form>
      {error && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
      )}
    </Card>
  );
}

// ─── CV Upload ────────────────────────────────────────────────

function CVSection({
  cvs,
  onUploaded,
  onDeleted,
}: {
  cvs: CV[];
  onUploaded: (cv: CV) => void;
  onDeleted: (id: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const cv = await uploadCV(file);
      onUploaded(cv);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload eșuat");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Card title="CV">
      {cvs.length === 0 ? (
        <p style={{ color: "#aaa" }}>Nu ai încărcat niciun CV.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {cvs.map((cv) => (
            <div
              key={cv.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 1rem",
                border: `1px solid ${cv.is_active ? "#646cff" : "#444"}`,
                borderRadius: "6px",
              }}
            >
              <div>
                <a
                  href={cv.file}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#646cff" }}
                >
                  📄 CV —{" "}
                  {new Date(cv.uploaded_at).toLocaleDateString("ro-RO")}
                </a>
                {cv.is_active && (
                  <span
                    style={{
                      marginLeft: "0.75rem",
                      fontSize: "0.75rem",
                      background: "#1a1a4a",
                      color: "#aaaaff",
                      padding: "2px 8px",
                      borderRadius: "10px",
                    }}
                  >
                    activ
                  </span>
                )}
                {cv.is_processed && (
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      fontSize: "0.75rem",
                      color: "#88cc88",
                    }}
                  >
                    ✓ procesat
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteCV(cv.id).then(() => onDeleted(cv.id))}
                style={{
                  background: "none",
                  border: "1px solid #ff6b6b",
                  color: "#ff6b6b",
                  borderRadius: "4px",
                  cursor: "pointer",
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.8rem",
                }}
              >
                Șterge
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        style={{
          display: "inline-block",
          padding: "0.5rem 1rem",
          border: "1px dashed #646cff",
          borderRadius: "6px",
          cursor: uploading ? "not-allowed" : "pointer",
          color: "#646cff",
          fontSize: "0.9rem",
        }}
      >
        {uploading ? "Se încarcă..." : "＋ Încarcă CV (PDF/DOC)"}
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </label>
      {error && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
      )}
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #444",
        borderRadius: "8px",
        padding: "1.5rem",
      }}
    >
      <h2
        style={{
          margin: "0 0 1.25rem",
          fontSize: "1.1rem",
          color: "#646cff",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
        ...style,
      }}
    >
      <label style={{ fontSize: "0.8rem", color: "#aaa" }}>{label}</label>
      {children}
    </div>
  );
}