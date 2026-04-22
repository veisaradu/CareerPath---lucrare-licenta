import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRecommendations,
  generateRoadmap,
  type Recommendation,
} from "../api/recommendations";

const JOB_TYPE: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  internship: "Internship",
  freelance: "Freelance",
};

const LEVEL: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior",
};

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getRecommendations()
      .then((data) =>
        setRecs([...data].sort((a, b) => b.match_score - a.match_score))
      )
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateRoadmap = async (rec: Recommendation) => {
    setGenerating(rec.id);
    try {
      await generateRoadmap(rec.id);
      navigate("/roadmap");
    } finally {
      setGenerating(null);
    }
  };

  if (loading) return <p>Se încarcă recomandările...</p>;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 0.25rem" }}>Recomandări</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        {recs.length} joburi potrivite profilului tău
      </p>

      {recs.length === 0 ? (
        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
            padding: "3rem",
            textAlign: "center",
            color: "#666",
          }}
        >
          <p>Nu există recomandări încă.</p>
          <p style={{ fontSize: "0.9rem" }}>
            Încarcă un CV procesat pentru a genera recomandări.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {recs.map((rec) => (
            <RecCard
              key={rec.id}
              rec={rec}
              generating={generating === rec.id}
              onGenerateRoadmap={() => handleGenerateRoadmap(rec)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecCard({
  rec,
  generating,
  onGenerateRoadmap,
}: {
  rec: Recommendation;
  generating: boolean;
  onGenerateRoadmap: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const score = rec.match_score;
  const scoreColor =
    score >= 75 ? "#88cc88" : score >= 50 ? "#ffaa55" : "#ff6b6b";

  return (
    <div
      style={{
        border: "1px solid #2a2a2a",
        borderRadius: "10px",
        padding: "1.5rem",
        background: "#141414",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem" }}>
            {rec.job_detail.title}
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "0.88rem" }}>
            {rec.job_detail.company_name}
          </p>
        </div>

        {/* Score circle */}
        <div style={{ textAlign: "center", minWidth: "64px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              border: `3px solid ${scoreColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: scoreColor,
              }}
            >
              {score}%
            </span>
          </div>
          <span style={{ fontSize: "0.65rem", color: "#666" }}>potrivire</span>
        </div>
      </div>

      {/* Badges */}
      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          flexWrap: "wrap",
          margin: "1rem 0",
        }}
      >
        <span className="badge">
          {JOB_TYPE[rec.job_detail.job_type] ?? rec.job_detail.job_type}
        </span>
        <span className="badge">
          {LEVEL[rec.job_detail.experience_level] ??
            rec.job_detail.experience_level}
        </span>
        <span className="badge">
          {rec.job_detail.is_remote
            ? "Remote"
            : rec.job_detail.location || "On-site"}
        </span>
      </div>

      {/* Explanation */}
      <p
        style={{
          color: "#aaa",
          fontSize: "0.88rem",
          lineHeight: 1.6,
          margin: "0 0 1rem",
        }}
      >
        {rec.explanation}
      </p>

      {/* Expandable skills */}
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          background: "none",
          border: "none",
          color: "#646cff",
          cursor: "pointer",
          padding: 0,
          fontSize: "0.85rem",
          marginBottom: expanded ? "1rem" : 0,
        }}
      >
        {expanded ? "▲ Ascunde skilluri" : "▼ Vezi skilluri"}
      </button>

      {expanded && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {rec.matched_skills_json.length > 0 && (
            <div>
              <p
                style={{
                  margin: "0 0 0.4rem",
                  fontSize: "0.75rem",
                  color: "#666",
                  textTransform: "uppercase",
                }}
              >
                Skilluri potrivite
              </p>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {rec.matched_skills_json.map((s) => (
                  <span
                    key={s}
                    className="badge"
                    style={{ background: "#1a2e1a", color: "#88cc88" }}
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {rec.skill_gap_json.length > 0 && (
            <div>
              <p
                style={{
                  margin: "0 0 0.4rem",
                  fontSize: "0.75rem",
                  color: "#666",
                  textTransform: "uppercase",
                }}
              >
                Skilluri lipsă
              </p>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {rec.skill_gap_json.map((s) => (
                  <span
                    key={s}
                    className="badge"
                    style={{ background: "#2e1a1a", color: "#ff6b6b" }}
                  >
                    ✗ {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action */}
      <div style={{ marginTop: "1.25rem" }}>
        <button
          onClick={onGenerateRoadmap}
          disabled={generating}
          style={{
            backgroundColor: generating ? "#2a2a2a" : "#646cff",
            color: generating ? "#555" : "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1.1rem",
            cursor: generating ? "not-allowed" : "pointer",
            fontSize: "0.88rem",
            fontWeight: 500,
          }}
        >
          {generating ? "Se generează..." : "🗺 Generează Roadmap"}
        </button>
      </div>
    </div>
  );
}