import { useEffect, useState } from "react";
import {
  getMyAccount,
  updateProfile,
  getMySkills,
  getAllSkills,
  addSkill,
  updateSkill,
  deleteSkill,
  getMyCVs,
  uploadCV,
  deleteCV,
  type UserAccount,
  type UserSkillProficiency,
  type Skill,
  type CV,
} from "../api/users";
import API from "../api/auth";

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
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

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!account) return <p style={{ color: "red" }}>Failed to load account.</p>;
  if (!account.profile) return <p style={{ color: "red" }}>Profile not found. Contact administrator.</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ margin: 0 }}>My Profile</h1>

      <ProfileInfoSection
        account={account}
        onSaved={(updated) => setAccount((prev) => prev ? { ...prev, profile: updated } : prev)}
      />
      <SkillsSection
        skills={skills}
        allSkills={allSkills}
        onAdd={(s) => setSkills((prev) => [...prev, s])}
        onUpdate={(s) => setSkills((prev) => prev.map((x) => x.id === s.id ? s : x))}
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

function ProfileInfoSection({ account, onSaved }: { account: UserAccount; onSaved: (p: UserAccount["profile"]) => void }) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateProfile(form);
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Profile Information">
      <div style={{ marginBottom: "1rem", color: "#aaa", fontSize: "0.9rem" }}>
        <strong style={{ color: "#fff" }}>{account.username}</strong> · {account.email}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Desired Role">
          <input name="desired_role" value={form.desired_role} onChange={handleChange} placeholder="e.g. Backend Developer" />
        </Field>
        <Field label="Education Level">
          <input name="education_level" value={form.education_level} onChange={handleChange} placeholder="e.g. Bachelor's in CS" />
        </Field>
        <Field label="Location">
          <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Bucharest" />
        </Field>
        <Field label="Years of Experience">
          <input name="experience_years" type="number" min={0} value={form.experience_years} onChange={handleChange} />
        </Field>
        <Field label="Interests" style={{ gridColumn: "1 / -1" }}>
          <textarea name="interests" value={form.interests} onChange={handleChange} rows={3} placeholder="e.g. AI, Web Development, Open Source..." />
        </Field>
        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input id="open_to_remote" name="open_to_remote" type="checkbox" checked={form.open_to_remote} onChange={handleChange} />
          <label htmlFor="open_to_remote">Open to remote</label>
        </div>
        {saveError && <p style={{ gridColumn: "1 / -1", color: "red", margin: 0 }}>{saveError}</p>}
        <div style={{ gridColumn: "1 / -1" }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function SkillsSection({
  skills, allSkills, onAdd, onUpdate, onDelete,
}: {
  skills: UserSkillProficiency[];
  allSkills: Skill[];
  onAdd: (s: UserSkillProficiency) => void;
  onUpdate: (s: UserSkillProficiency) => void;
  onDelete: (id: number) => void;
}) {
  const [selectedSkill, setSelectedSkill] = useState("");
  const [level, setLevel] = useState<UserSkillProficiency["level"]>("beginner");
  const [years, setYears] = useState(0);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const usedSkillIds = new Set(skills.map((s) => s.skill));
  const available = allSkills.filter((s) => !usedSkillIds.has(s.id));

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSkill) return;
    setAdding(true);
    setError(null);
    try {
      const created = await addSkill({ skill: Number(selectedSkill), level, years_experience: years });
      onAdd(created);
      setSelectedSkill("");
      setYears(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card title="Skills">
      {skills.length === 0 ? (
        <p style={{ color: "#aaa" }}>No skills added yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {skills.map((s) =>
            editingId === s.id ? (
              <SkillEditRow
                key={s.id}
                skill={s}
                onSave={(updated) => { onUpdate(updated); setEditingId(null); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.8rem", border: "1px solid #333", borderRadius: "8px", fontSize: "0.85rem", background: "#1a1a1a" }}>
                <span style={{ fontWeight: 500 }}>{s.skill_name}</span>
                <span style={{ color: "#aaa", fontSize: "0.8rem" }}>· {s.level}</span>
                {s.years_experience > 0 && (
                  <span style={{ color: "#666", fontSize: "0.78rem" }}>· {s.years_experience}y</span>
                )}
                <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem" }}>
                  <button
                    onClick={() => setEditingId(s.id)}
                    style={{ background: "none", border: "1px solid #444", color: "#aaa", cursor: "pointer", padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSkill(s.id).then(() => onDelete(s.id))}
                    style={{ background: "none", border: "1px solid #ff6b6b33", color: "#ff6b6b", cursor: "pointer", padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="Skill">
          <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)} required>
            <option value="">Select skill...</option>
            {available.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Level">
          <select value={level} onChange={(e) => setLevel(e.target.value as UserSkillProficiency["level"])}>
            {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Exp. years">
          <input type="number" min={0} step={0.5} value={years} onChange={(e) => setYears(Number(e.target.value))} style={{ width: "80px" }} />
        </Field>
        <button type="submit" disabled={adding} style={{ marginBottom: "0px" }}>
          {adding ? "..." : "+ Add"}
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
    </Card>
  );
}

function SkillEditRow({ skill, onSave, onCancel }: { skill: UserSkillProficiency; onSave: (s: UserSkillProficiency) => void; onCancel: () => void }) {
  const [level, setLevel] = useState<UserSkillProficiency["level"]>(skill.level);
  const [years, setYears] = useState(skill.years_experience);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateSkill(skill.id, { level, years_experience: years });
      onSave(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.8rem", border: "1px solid #646cff", borderRadius: "8px", fontSize: "0.85rem", background: "#0d0d2b", flexWrap: "wrap" }}>
      <span style={{ fontWeight: 500, minWidth: "80px" }}>{skill.skill_name}</span>
      <select value={level} onChange={(e) => setLevel(e.target.value as UserSkillProficiency["level"])} style={{ fontSize: "0.82rem", padding: "0.2rem 0.4rem" }}>
        {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <input
        type="number" min={0} step={0.5} value={years}
        onChange={(e) => setYears(Number(e.target.value))}
        style={{ width: "70px", fontSize: "0.82rem", padding: "0.2rem 0.4rem" }}
        placeholder="Years"
      />
      <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem" }}>
        <button onClick={handleSave} disabled={saving} style={{ background: "#646cff", border: "none", color: "#fff", cursor: saving ? "not-allowed" : "pointer", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.78rem" }}>
          {saving ? "..." : "Save"}
        </button>
        <button onClick={onCancel} style={{ background: "none", border: "1px solid #444", color: "#aaa", cursor: "pointer", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.78rem" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function CVSection({ cvs, onUploaded, onDeleted }: { cvs: CV[]; onUploaded: (cv: CV) => void; onDeleted: (id: number) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const unprocessed = cvs.filter((cv) => cv.is_active && !cv.is_processed);
    if (unprocessed.length === 0) return;

    const interval = setInterval(async () => {
      for (const cv of unprocessed) {
        try {
          const { data } = await API.get(`/cvs/${cv.id}/status/`);
          if (data.is_processed) {
            setProcessingIds((prev) => { const next = new Set(prev); next.delete(cv.id); return next; });
            window.location.reload();
          }
        } catch { }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [cvs]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const cv = await uploadCV(file);
      onUploaded(cv);
      setProcessingIds((prev) => new Set(prev).add(cv.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Card title="CV">
      {cvs.length === 0 ? (
        <p style={{ color: "#aaa" }}>No CV uploaded.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
          {cvs.map((cv) => (
            <div key={cv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", border: `1px solid ${cv.is_active ? "#646cff" : "#444"}`, borderRadius: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <a href={cv.file} target="_blank" rel="noreferrer" style={{ color: "#646cff" }}>
                  CV — {new Date(cv.uploaded_at).toLocaleDateString("en-US")}
                </a>
                {cv.is_active && (
                  <span style={{ fontSize: "0.75rem", background: "#1a1a4a", color: "#aaaaff", padding: "2px 8px", borderRadius: "10px" }}>active</span>
                )}
                {processingIds.has(cv.id) && !cv.is_processed ? (
                  <span style={{ fontSize: "0.75rem", color: "#ffaa55" }}>Processing...</span>
                ) : cv.is_processed ? (
                  <span style={{ fontSize: "0.75rem", color: "#88cc88" }}>processed</span>
                ) : null}
              </div>
              <button
                onClick={() => deleteCV(cv.id).then(() => onDeleted(cv.id))}
                style={{ background: "none", border: "1px solid #ff6b6b", color: "#ff6b6b", borderRadius: "4px", cursor: "pointer", padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <label style={{ display: "inline-block", padding: "0.5rem 1rem", border: "1px dashed #646cff", borderRadius: "6px", cursor: uploading ? "not-allowed" : "pointer", color: "#646cff", fontSize: "0.9rem" }}>
        {uploading ? "Uploading..." : "＋ Upload CV (PDF/DOC)"}
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} disabled={uploading} style={{ display: "none" }} />
      </label>

      {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #444", borderRadius: "8px", padding: "1.5rem" }}>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", color: "#646cff" }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", ...style }}>
      <label style={{ fontSize: "0.8rem", color: "#aaa" }}>{label}</label>
      {children}
    </div>
  );
}
