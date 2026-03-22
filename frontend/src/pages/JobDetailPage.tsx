import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getJobDetail, type JobDetail } from "../api/jobs";

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  internship: "Internship",
  freelance: "Freelance",
};

const LEVEL_LABELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getJobDetail(Number(id))
      .then(setJob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Se încarcă...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!job) return null;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Back */}
      <Link
        to="/jobs"
        style={{ fontSize: "0.9rem", display: "inline-block", marginBottom: "1.5rem" }}
      >
        ← Înapoi la joburi
      </Link>

      {/* Header */}
      <div
        style={{
          border: "1px solid #444",
          borderRadius: "8px",
          padding: "2rem",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ margin: "0 0 0.5rem" }}>{job.title}</h1>
        <p style={{ color: "#aaa", margin: "0 0 1.5rem", fontSize: "1rem" }}>
           {job.company_name || "Companie Confidențială"}
        </p>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span className="badge">
            {job.category_detail?.name ?? "Fără categorie"}
          </span>
          <span className="badge">
            {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
          </span>
          <span className="badge">
            {LEVEL_LABELS[job.experience_level] ?? job.experience_level}
          </span>
          <span className="badge">
            {job.is_remote ? " Remote" : ` ${job.location || "On-site"}`}
          </span>
        </div>
      </div>

      {/* Descriere */}
      <Section title="Descriere">
        <p style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {job.description}
        </p>
      </Section>

      {/* Skilluri obligatorii */}
      {job.required_skills.length > 0 && (
        <Section title="Skilluri obligatorii">
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {job.required_skills.map((skill) => (
              <span
                key={skill.id}
                className="badge"
                style={{ backgroundColor: "#3a3a6a", color: "#aaaaff" }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Skilluri preferate */}
      {job.preferred_skills.length > 0 && (
        <Section title="Skilluri preferate">
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {job.preferred_skills.map((skill) => (
              <span
                key={skill.id}
                className="badge"
                style={{ backgroundColor: "#2a4a2a", color: "#88cc88" }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
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
        marginBottom: "1rem",
      }}
    >
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", color: "#646cff" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}