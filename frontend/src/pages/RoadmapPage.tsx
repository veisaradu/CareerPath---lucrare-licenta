import { useEffect, useState } from "react";
import { getRoadmaps, completeStep, uncompleteStep } from "../api/roadmap";
import type { Roadmap, RoadmapStep } from "../api/recommendations";

const PRIORITY_COLOR: Record<string, string> = {
  high: "#ff6b6b",
  medium: "#ffaa55",
  low: "#88cc88",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number>(0);

  useEffect(() => {
    getRoadmaps()
      .then((data) => setRoadmaps(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading roadmap...</p>;

  if (roadmaps.length === 0) {
    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
        <h1>Roadmap</h1>
        <div style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "3rem", color: "#666" }}>
          <p>No roadmap generated yet.</p>
          <p style={{ fontSize: "0.9rem" }}>
            Go to <a href="/recommendations">Recommendations</a> and click "Generate Roadmap".
          </p>
        </div>
      </div>
    );
  }

  const roadmap = roadmaps[selected];
  const completedSet = new Set(roadmap.completed_steps ?? []);
  const completedCount = completedSet.size;
  const totalSteps = roadmap.steps_json.length;

  function handleToggleStep(stepOrder: number, isCompleted: boolean) {
    const fn = isCompleted ? uncompleteStep : completeStep;
    fn(roadmap.id, stepOrder).then((updated) => {
      setRoadmaps((prev) =>
        prev.map((r) =>
          r.id === roadmap.id ? { ...r, completed_steps: updated } : r
        )
      );
    });
  }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 0.25rem" }}>Learning Roadmap</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Personalized plan based on your skill gap
      </p>

      {roadmaps.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {roadmaps.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setSelected(i)}
              style={{ background: selected === i ? "#646cff" : "#1a1a1a", color: "#fff", border: `1px solid ${selected === i ? "#646cff" : "#444"}`, borderRadius: "6px", padding: "0.4rem 0.9rem", cursor: "pointer", fontSize: "0.85rem" }}
            >
              {r.target_job_detail.title}
            </button>
          ))}
        </div>
      )}

      <div style={{ border: "1px solid #2a2a2a", borderRadius: "10px", padding: "1.25rem 1.5rem", background: "#141414", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ margin: "0 0 0.2rem", color: "#888", fontSize: "0.8rem" }}>Target job</p>
          <strong style={{ fontSize: "1.05rem" }}>{roadmap.target_job_detail.title}</strong>
          <p style={{ margin: "0.2rem 0 0", color: "#666", fontSize: "0.85rem" }}>{roadmap.target_job_detail.company_name}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 0.2rem", color: "#888", fontSize: "0.8rem" }}>Estimated Total</p>
          <strong style={{ fontSize: "1.3rem", color: "#646cff" }}>{roadmap.estimated_total_hours}h</strong>
        </div>
      </div>

      {totalSteps > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.8rem", color: "#888" }}>
            <span>Progress</span>
            <span>{completedCount} / {totalSteps} steps completed</span>
          </div>
          <div style={{ height: "6px", background: "#2a2a2a", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(completedCount / totalSteps) * 100}%`, background: "#646cff", borderRadius: "3px", transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: "23px", top: "24px", bottom: "24px", width: "2px", background: "linear-gradient(to bottom, #646cff, #444 80%, transparent)", zIndex: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {roadmap.steps_json.map((step, idx) => (
            <StepNode
              key={step.order}
              step={step}
              isLast={idx === roadmap.steps_json.length - 1}
              isCompleted={completedSet.has(step.order)}
              onToggle={() => handleToggleStep(step.order, completedSet.has(step.order))}
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
  isCompleted,
  onToggle,
}: {
  step: RoadmapStep;
  isLast: boolean;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const color = isCompleted ? "#555" : (PRIORITY_COLOR[step.priority] ?? "#888");

  return (
    <div style={{ display: "flex", gap: "1rem", paddingBottom: isLast ? 0 : "1.5rem", position: "relative", zIndex: 1 }}>
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          title={isCompleted ? "Mark incomplete" : "Mark complete"}
          style={{ width: "48px", height: "48px", borderRadius: "50%", border: `2px solid ${color}`, background: isCompleted ? "#1a2e1a" : "#141414", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.95rem", color: color, boxShadow: isCompleted ? "none" : `0 0 12px ${color}33`, flexShrink: 0, cursor: "pointer", transition: "all 0.2s" }}
        >
          {isCompleted ? "Done" : step.order}
        </div>
      </div>

      <div
        style={{ flex: 1, border: "1px solid #2a2a2a", borderRadius: "8px", padding: "1rem 1.25rem", background: isCompleted ? "#111" : "#141414", cursor: "pointer", transition: "border-color 0.2s", borderColor: open ? color : "#2a2a2a", opacity: isCompleted ? 0.6 : 1 }}
        onClick={() => setOpen((p) => !p)}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <strong style={{ fontSize: "0.95rem", textDecoration: isCompleted ? "line-through" : "none", color: isCompleted ? "#666" : "#fff" }}>{step.skill}</strong>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {!isCompleted && (
              <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "10px", background: `${PRIORITY_COLOR[step.priority] ?? "#888"}22`, color: PRIORITY_COLOR[step.priority] ?? "#888", fontWeight: 600 }}>
                {PRIORITY_LABEL[step.priority]}
              </span>
            )}
            {isCompleted && (
              <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "10px", background: "#1a2e1a", color: "#88cc88", fontWeight: 600 }}>
                Completed
              </span>
            )}
            <span style={{ fontSize: "0.78rem", color: "#666" }}>~{step.estimated_hours}h</span>
            <span style={{ color: "#555", fontSize: "0.85rem" }}>{open ? "-" : "+"}</span>
          </div>
        </div>

        {open && (
          <div style={{ marginTop: "0.75rem" }}>
            <p style={{ margin: "0 0 0.75rem", color: "#aaa", fontSize: "0.88rem", lineHeight: 1.6 }}>{step.action}</p>
            {step.resource_url && (
              <a
                href={step.resource_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", color: "#646cff", background: "#0d0d2b", padding: "0.3rem 0.7rem", borderRadius: "4px", textDecoration: "none" }}
              >
                Learning Resource
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
