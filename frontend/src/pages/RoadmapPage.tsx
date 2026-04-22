import { useEffect, useState } from "react";
import { getRoadmaps } from "../api/roadmap";
import type { Roadmap, RoadmapStep } from "../api/recommendations";

const PRIORITY_COLOR: Record<string, string> = {
  high: "#ff6b6b",
  medium: "#ffaa55",
  low: "#88cc88",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "Prioritate mare",
  medium: "Prioritate medie",
  low: "Prioritate mică",
};

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number>(0);

  useEffect(() => {
    getRoadmaps()
      .then((data) => {
        setRoadmaps(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Se încarcă roadmap-ul...</p>;

  if (roadmaps.length === 0) {
    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
        <h1>Roadmap</h1>
        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
            padding: "3rem",
            color: "#666",
          }}
        >
          <p style={{ fontSize: "2rem", margin: "0 0 1rem" }}>🗺</p>
          <p>Nu ai niciun roadmap generat.</p>
          <p style={{ fontSize: "0.9rem" }}>
            Mergi la{" "}
            <a href="/recommendations">Recomandări</a> și apasă
            „Generează Roadmap".
          </p>
        </div>
      </div>
    );
  }

  const roadmap = roadmaps[selected];

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 0.25rem" }}>Roadmap de învățare</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Plan personalizat bazat pe skill gap-ul tău
      </p>

      {/* Selector dacă există mai multe */}
      {roadmaps.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          {roadmaps.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setSelected(i)}
              style={{
                background: selected === i ? "#646cff" : "#1a1a1a",
                color: "#fff",
                border: `1px solid ${selected === i ? "#646cff" : "#444"}`,
                borderRadius: "6px",
                padding: "0.4rem 0.9rem",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              {r.target_job_detail.title}
            </button>
          ))}
        </div>
      )}

      {/* Roadmap header */}
      <div
        style={{
          border: "1px solid #2a2a2a",
          borderRadius: "10px",
          padding: "1.25rem 1.5rem",
          background: "#141414",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <p style={{ margin: "0 0 0.2rem", color: "#888", fontSize: "0.8rem" }}>
            Target job
          </p>
          <strong style={{ fontSize: "1.05rem" }}>
            {roadmap.target_job_detail.title}
          </strong>
          <p style={{ margin: "0.2rem 0 0", color: "#666", fontSize: "0.85rem" }}>
            {roadmap.target_job_detail.company_name}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 0.2rem", color: "#888", fontSize: "0.8rem" }}>
            Total estimat
          </p>
          <strong style={{ fontSize: "1.3rem", color: "#646cff" }}>
            {roadmap.estimated_total_hours}h
          </strong>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: "relative" }}>
        {/* Linia verticală */}
        <div
          style={{
            position: "absolute",
            left: "23px",
            top: "24px",
            bottom: "24px",
            width: "2px",
            background:
              "linear-gradient(to bottom, #646cff, #444 80%, transparent)",
            zIndex: 0,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {roadmap.steps_json.map((step, idx) => (
            <StepNode
              key={step.order}
              step={step}
              isLast={idx === roadmap.steps_json.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepNode({
  step,
  isLast,
}: {
  step: RoadmapStep;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const color = PRIORITY_COLOR[step.priority] ?? "#888";

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        paddingBottom: isLast ? 0 : "1.5rem",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Bulina */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: `2px solid ${color}`,
            background: "#141414",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "0.95rem",
            color: color,
            boxShadow: `0 0 12px ${color}33`,
            flexShrink: 0,
          }}
        >
          {step.order}
        </div>
      </div>

      {/* Conținut */}
      <div
        style={{
          flex: 1,
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          padding: "1rem 1.25rem",
          background: "#141414",
          cursor: "pointer",
          transition: "border-color 0.2s",
          borderColor: open ? color : "#2a2a2a",
        }}
        onClick={() => setOpen((p) => !p)}
      >
        {/* Row 1: skill + priority + ore */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <strong style={{ fontSize: "0.95rem" }}>{step.skill}</strong>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "0.15rem 0.5rem",
                borderRadius: "10px",
                background: `${color}22`,
                color: color,
                fontWeight: 600,
              }}
            >
              {PRIORITY_LABEL[step.priority]}
            </span>
            <span style={{ fontSize: "0.78rem", color: "#666" }}>
              ~{step.estimated_hours}h
            </span>
            <span style={{ color: "#555", fontSize: "0.85rem" }}>
              {open ? "▲" : "▼"}
            </span>
          </div>
        </div>

        {/* Expandabil */}
        {open && (
          <div style={{ marginTop: "0.75rem" }}>
            <p
              style={{
                margin: "0 0 0.75rem",
                color: "#aaa",
                fontSize: "0.88rem",
                lineHeight: 1.6,
              }}
            >
              {step.action}
            </p>
            {step.resource_url && (
              <a
                href={step.resource_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.82rem",
                  color: "#646cff",
                  background: "#0d0d2b",
                  padding: "0.3rem 0.7rem",
                  borderRadius: "4px",
                  textDecoration: "none",
                }}
              >
                📚 Resursă de învățare →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}