import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardStats, type DashboardStats } from "../api/dashboard";

export default function DashboardPage() {
  const { username } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Hello, {username}!</h1>
        <p style={styles.subtitle}>Your CareerPath profile summary</p>
      </div>

      {loading ? (
        <p style={styles.muted}>Loading...</p>
      ) : !stats ? (
        <p style={styles.error}>Failed to load data.</p>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <StatCard
              label="CV Status"
              value={CV_STATUS_LABEL[stats.cv_status]}
              valueColor={CV_STATUS_COLOR[stats.cv_status]}
            />
            <StatCard
              label="Recommendations"
              value={stats.recommendations_count > 0 ? `${stats.recommendations_count} jobs` : "—"}
            />
            <StatCard
              label="Top Match"
              value={stats.top_match_score !== null ? `${stats.top_match_score}%` : "—"}
              valueColor={stats.top_match_score !== null ? "#88cc88" : undefined}
            />
            <StatCard
              label="Skills Added"
              value={stats.skills_count > 0 ? `${stats.skills_count}` : "—"}
            />
          </div>

          <div style={styles.actionsGrid}>
            <ActionCard
              title="CV"
              description={CV_ACTION_DESC[stats.cv_status]}
              actionLabel={stats.cv_status === "none" ? "Upload CV" : "Manage CV"}
              onClick={() => navigate("/profile")}
              highlight={stats.cv_status === "none"}
              status={stats.cv_status === "processed" ? "success" : undefined}
            />
            <ActionCard
              title="Recommendations"
              description={
                stats.recommendations_count === 0
                  ? "Process your CV to receive personalized recommendations."
                  : `${stats.recommendations_count} jobs recommended based on your profile.`
              }
              actionLabel="View Recommendations"
              onClick={() => navigate("/recommendations")}
              disabled={stats.recommendations_count === 0}
            />
            <ActionCard
              title="Roadmap"
              description={
                stats.active_roadmaps_count === 0
                  ? "No active learning plan. Generate one from a recommendation."
                  : `${stats.active_roadmaps_count} active learning plan(s).`
              }
              actionLabel="View Roadmap"
              onClick={() => navigate("/roadmap")}
              disabled={stats.active_roadmaps_count === 0}
            />
            <ActionCard
              title="Chatbot"
              description="Chat with AI about career, skills, or jobs."
              actionLabel="Open Chat"
              onClick={() => navigate("/chat")}
            />
          </div>
        </>
      )}
    </div>
  );
}

const CV_STATUS_LABEL: Record<DashboardStats["cv_status"], string> = {
  none: "Not uploaded",
  uploaded: "Uploaded",
  processed: "Processed",
};

const CV_STATUS_COLOR: Record<DashboardStats["cv_status"], string> = {
  none: "#ff6b6b",
  uploaded: "#ffaa55",
  processed: "#88cc88",
};

const CV_ACTION_DESC: Record<DashboardStats["cv_status"], string> = {
  none: "You haven't uploaded a CV yet. Upload it to receive recommendations.",
  uploaded: "CV uploaded, awaiting processing.",
  processed: "CV processed. Recommendations are available.",
};

function StatCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color: valueColor ?? "#fff" }}>{value}</span>
    </div>
  );
}

function ActionCard({
  title, description, actionLabel, onClick, highlight, disabled, status,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  highlight?: boolean;
  disabled?: boolean;
  status?: "success";
}) {
  return (
    <div
      style={{
        ...styles.actionCard,
        borderColor: highlight ? "#646cff" : status === "success" ? "#2a4a2a" : "#2a2a2a",
        background: highlight ? "#0d0d2b" : status === "success" ? "#0d1f0d" : "#141414",
      }}
    >
      <div style={styles.actionTop}>
        <span style={styles.actionTitle}>{title}</span>
        {status === "success" && <span style={styles.badge}>Active</span>}
      </div>
      <p style={styles.actionDesc}>{description}</p>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          ...styles.actionBtn,
          backgroundColor: disabled ? "#2a2a2a" : highlight ? "#646cff" : "#3a3a3a",
          color: disabled ? "#555" : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

const styles = {
  page: { maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column" as const, gap: "2rem" },
  header: { borderBottom: "1px solid #222", paddingBottom: "1.25rem" },
  title: { margin: "0 0 0.25rem", fontSize: "1.75rem", fontWeight: 700 },
  subtitle: { margin: 0, color: "#666", fontSize: "0.9rem" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" },
  statCard: { border: "1px solid #2a2a2a", borderRadius: "8px", padding: "1.1rem 1.25rem", background: "#141414", display: "flex", flexDirection: "column" as const, gap: "0.4rem" },
  statLabel: { fontSize: "0.75rem", color: "#666", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  statValue: { fontSize: "1.2rem", fontWeight: 600 },
  actionsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" },
  actionCard: { border: "1px solid #2a2a2a", borderRadius: "8px", padding: "1.25rem", display: "flex", flexDirection: "column" as const, gap: "0.75rem" },
  actionTop: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  actionTitle: { fontWeight: 600, fontSize: "0.95rem" },
  badge: { fontSize: "0.7rem", color: "#88cc88", background: "#1a2e1a", padding: "0.2rem 0.5rem", borderRadius: "4px" },
  actionDesc: { color: "#666", fontSize: "0.82rem", margin: 0, lineHeight: 1.55, flexGrow: 1 },
  actionBtn: { padding: "0.5rem 0.75rem", borderRadius: "6px", border: "none", fontWeight: 500, fontSize: "0.85rem", transition: "opacity 0.15s" },
  muted: { color: "#555" },
  error: { color: "#ff6b6b" },
} as const;
