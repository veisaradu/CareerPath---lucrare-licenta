import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRecommendations,
  generateRoadmap,
  type Recommendation,
} from "../api/recommendations";
import jsPDF from "jspdf";

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

const PAGE_SIZE = 5;

const BTN: React.CSSProperties = {
  background: "#1a1a1a",
  color: "#fff",
  border: "1px solid #444",
  borderRadius: "6px",
  padding: "0.4rem 0.8rem",
  fontSize: "0.85rem",
  cursor: "pointer",
};

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const navigate = useNavigate();

  function fetchPage(p: number) {
    setLoading(true);
    getRecommendations(p)
      .then((data) => {
        setRecs([...data.results].sort((a, b) => b.match_score - a.match_score));
        setTotalCount(data.count);
        setPage(p);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchPage(1); }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleGenerateRoadmap = async (rec: Recommendation) => {
    setGenerating(rec.id);
    try {
      await generateRoadmap(rec.id);
      navigate("/roadmap");
    } finally {
      setGenerating(null);
    }
  };

  const handleExport = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("CareerPath Recommendations", 20, y);
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US")}`, 20, y);
    y += 15;

    recs.forEach((rec, index) => {
      if (y > 260) { doc.addPage(); y = 20; }

      doc.setFontSize(13);
      doc.setTextColor(0);
      doc.text(`${index + 1}. ${rec.job_detail.title}`, 20, y);
      y += 7;

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Company: ${rec.job_detail.company_name || "Confidential"}`, 25, y);
      y += 6;
      doc.text(`Match: ${rec.match_score}%`, 25, y);
      y += 6;

      if (rec.matched_skills_json.length > 0) {
        doc.setTextColor(40, 120, 40);
        const matched = `Matched skills: ${rec.matched_skills_json.join(", ")}`;
        const matchedLines = doc.splitTextToSize(matched, 160);
        doc.text(matchedLines, 25, y);
        y += matchedLines.length * 6;
      }

      if (rec.skill_gap_json.length > 0) {
        doc.setTextColor(180, 40, 40);
        const gap = `Skill gaps: ${rec.skill_gap_json.join(", ")}`;
        const gapLines = doc.splitTextToSize(gap, 160);
        doc.text(gapLines, 25, y);
        y += gapLines.length * 6;
      }

      y += 8;
      doc.setDrawColor(200);
      doc.line(20, y, 190, y);
      y += 8;
    });

    doc.save("recommendations-careerpath.pdf");
  };

  if (loading) return <p>Loading recommendations...</p>;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
        <h1 style={{ margin: 0 }}>Recommendations</h1>
        {recs.length > 0 && (
          <button
            onClick={handleExport}
            style={{ background: "#2a2a2a", color: "#fff", border: "1px solid #444", borderRadius: "6px", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.88rem" }}
          >
            Export PDF
          </button>
        )}
      </div>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        {totalCount} jobs matching your profile
      </p>

      {recs.length === 0 ? (
        <div style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "3rem", textAlign: "center", color: "#666" }}>
          <p>No recommendations yet.</p>
          <p style={{ fontSize: "0.9rem" }}>Upload and process a CV to generate recommendations.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {recs.map((rec) => (
            <RecCard
              key={rec.id}
              rec={rec}
              generating={generating === rec.id}
              onGenerateRoadmap={() => handleGenerateRoadmap(rec)}
              onChat={() => navigate(`/chat?rec=${rec.id}`)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "2rem" }}>
          <button onClick={() => fetchPage(page - 1)} disabled={page === 1} style={{ ...BTN, opacity: page === 1 ? 0.4 : 1 }}>
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchPage(p)}
              style={{ ...BTN, background: p === page ? "#646cff" : "#1a1a1a", border: p === page ? "1px solid #646cff" : "1px solid #444" }}
            >
              {p}
            </button>
          ))}
          <button onClick={() => fetchPage(page + 1)} disabled={page === totalPages} style={{ ...BTN, opacity: page === totalPages ? 0.4 : 1 }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function RecCard({ rec, generating, onGenerateRoadmap, onChat }: { rec: Recommendation; generating: boolean; onGenerateRoadmap: () => void; onChat: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const score = rec.match_score;
  const scoreColor = score >= 75 ? "#88cc88" : score >= 50 ? "#ffaa55" : "#ff6b6b";

  return (
    <div style={{ border: "1px solid #2a2a2a", borderRadius: "10px", padding: "1.5rem", background: "#141414" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem" }}>{rec.job_detail.title}</h2>
          <p style={{ margin: 0, color: "#888", fontSize: "0.88rem" }}>{rec.job_detail.company_name}</p>
        </div>
        <div style={{ textAlign: "center", minWidth: "64px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: `3px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: scoreColor }}>{score}%</span>
          </div>
          <span style={{ fontSize: "0.65rem", color: "#666" }}>match</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", margin: "1rem 0" }}>
        <span className="badge">{JOB_TYPE[rec.job_detail.job_type] ?? rec.job_detail.job_type}</span>
        <span className="badge">{LEVEL[rec.job_detail.experience_level] ?? rec.job_detail.experience_level}</span>
        <span className="badge">{rec.job_detail.is_remote ? "Remote" : rec.job_detail.location || "On-site"}</span>
      </div>

      <p style={{ color: "#aaa", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 1rem" }}>{rec.explanation}</p>

      <button
        onClick={() => setExpanded((p) => !p)}
        style={{ background: "none", border: "none", color: "#646cff", cursor: "pointer", padding: 0, fontSize: "0.85rem", marginBottom: expanded ? "1rem" : 0 }}
      >
        {expanded ? "Hide skills" : "Show skills"}
      </button>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {rec.matched_skills_json.length > 0 && (
            <div>
              <p style={{ margin: "0 0 0.4rem", fontSize: "0.75rem", color: "#666", textTransform: "uppercase" }}>Matched Skills</p>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {rec.matched_skills_json.map((s) => (
                  <span key={s} className="badge" style={{ background: "#1a2e1a", color: "#88cc88" }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {rec.skill_gap_json.length > 0 && (
            <div>
              <p style={{ margin: "0 0 0.4rem", fontSize: "0.75rem", color: "#666", textTransform: "uppercase" }}>Skill Gaps</p>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {rec.skill_gap_json.map((s) => (
                  <span key={s} className="badge" style={{ background: "#2e1a1a", color: "#ff6b6b" }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem" }}>
        <button
          onClick={onGenerateRoadmap}
          disabled={generating}
          style={{ backgroundColor: generating ? "#2a2a2a" : "#646cff", color: generating ? "#555" : "#fff", border: "none", borderRadius: "6px", padding: "0.5rem 1.1rem", cursor: generating ? "not-allowed" : "pointer", fontSize: "0.88rem", fontWeight: 500 }}
        >
          {generating ? "Generating..." : "Generate Roadmap"}
        </button>
        <button
          onClick={onChat}
          style={{ background: "#1a1a1a", color: "#646cff", border: "1px solid #646cff", borderRadius: "6px", padding: "0.5rem 1.1rem", cursor: "pointer", fontSize: "0.88rem", fontWeight: 500 }}
        >
          Ask AI
        </button>
      </div>
    </div>
  );
}
