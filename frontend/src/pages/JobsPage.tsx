import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJobs, type JobList } from "../api/jobs";

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

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJobs()
      .then(setJobs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Se încarcă joburile...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ marginBottom: "0.5rem" }}>Joburi Disponibile</h1>
      <p style={{ color: "#aaa", marginBottom: "2rem" }}>
        {jobs.length} joburi active
      </p>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        }}
      >
        {jobs.length === 0 ? (
          <p>Nu există joburi active momentan.</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              style={{
                border: "1px solid #444",
                borderRadius: "8px",
                padding: "1.5rem",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <h3 style={{ margin: 0 }}>{job.title}</h3>
              <p style={{ color: "#aaa", fontSize: "0.9rem", margin: 0 }}>
                 {job.company_name || "Companie Confidențială"}
              </p>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span className="badge">{job.category_name}</span>
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

              <Link
                to={`/jobs/${job.id}`}
                style={{
                  marginTop: "auto",
                  display: "block",
                  textAlign: "center",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  backgroundColor: "#646cff",
                  color: "#fff",
                  fontWeight: 500,
                }}
              >
                Vezi Detalii →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}