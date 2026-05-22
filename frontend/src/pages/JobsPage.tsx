import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getJobs, getCategories, type JobList, type JobFilters, type Category } from "../api/jobs";
import { getRecommendations, type Recommendation } from "../api/recommendations";

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

const SELECT_STYLE: React.CSSProperties = {
  background: "#1a1a1a",
  color: "#fff",
  border: "1px solid #444",
  borderRadius: "6px",
  padding: "0.4rem 0.6rem",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const PAGE_SIZE = 5;

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobList[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<JobFilters>({});
  const [searchInput, setSearchInput] = useState("");

  const fetchJobs = useCallback((activeFilters: JobFilters, activePage = 1) => {
    setLoading(true);
    getJobs(activeFilters, activePage)
      .then((data) => {
        setJobs(data.results);
        setTotalCount(data.count);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([getRecommendations(), getCategories()])
      .then(([r, c]) => {
        setRecommendations(r.results);
        setCategories(c);
      })
      .catch(() => {});
    fetchJobs({});
  }, [fetchJobs]);

  function handleFilterChange(patch: Partial<JobFilters>) {
    const next = { ...filters, ...patch };
    (Object.keys(next) as (keyof JobFilters)[]).forEach((k) => {
      if (next[k] === undefined || next[k] === "") delete next[k];
    });
    setFilters(next);
    setPage(1);
    fetchJobs(next, 1);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleFilterChange({ search: searchInput.trim() || undefined });
  }

  function clearFilters() {
    setFilters({});
    setSearchInput("");
    setPage(1);
    fetchJobs({}, 1);
  }

  function goToPage(p: number) {
    setPage(p);
    fetchJobs(filters, p);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const scoreMap = new Map(recommendations.map((r) => [r.job, r.match_score]));
  const hasActiveFilters =
    Object.keys(filters).length > 0 || searchInput !== "";

  return (
    <div>
      <h1 style={{ marginBottom: "0.5rem" }}>Available Jobs</h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "#1a1a1a",
          borderRadius: "8px",
          border: "1px solid #333",
        }}
      >
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.4rem" }}>
          <input
            type="text"
            placeholder="Title or company..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              ...SELECT_STYLE,
              minWidth: "180px",
            }}
          />
          <button
            type="submit"
            style={{
              ...SELECT_STYLE,
              background: "#646cff",
              border: "none",
              padding: "0.4rem 0.8rem",
            }}
          >
            Search
          </button>
        </form>

        <select
          value={filters.job_type ?? ""}
          onChange={(e) =>
            handleFilterChange({ job_type: e.target.value || undefined })
          }
          style={SELECT_STYLE}
        >
          <option value="">Job Type</option>
          {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={filters.experience_level ?? ""}
          onChange={(e) =>
            handleFilterChange({ experience_level: e.target.value || undefined })
          }
          style={SELECT_STYLE}
        >
          <option value="">Experience Level</option>
          {Object.entries(LEVEL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={filters.category ?? ""}
          onChange={(e) =>
            handleFilterChange({
              category: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          style={SELECT_STYLE}
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={filters.is_remote === true}
            onChange={(e) =>
              handleFilterChange({ is_remote: e.target.checked ? true : undefined })
            }
          />
          Remote Only
        </label>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              ...SELECT_STYLE,
              background: "transparent",
              border: "1px solid #666",
              color: "#aaa",
            }}
          >
            Reset
          </button>
        )}
      </div>

      <p style={{ color: "#aaa", marginBottom: "1.5rem" }}>
        {loading ? "Loading..." : `${jobs.length} jobs${hasActiveFilters ? " (filtered)" : " active"}`}
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        }}
      >
        {!loading && jobs.length === 0 ? (
          <p style={{ color: "#aaa" }}>No jobs match the current filters.</p>
        ) : (
          jobs.map((job) => {
            const score = scoreMap.get(job.id);
            const hasRecs = recommendations.length > 0;
            const isLowMatch = hasRecs && score === undefined;
            const scoreColor =
              score === undefined
                ? null
                : score >= 75
                ? "#88cc88"
                : score >= 50
                ? "#ffaa55"
                : "#ff6b6b";
            const badgeColor = isLowMatch ? "#ff6b6b" : scoreColor;

            return (
              <div
                key={job.id}
                style={{
                  border: `1px solid ${badgeColor ?? "#444"}`,
                  borderRadius: "8px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  position: "relative",
                }}
              >
                {(score !== undefined || isLowMatch) && (
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      background: `${badgeColor}22`,
                      color: badgeColor!,
                      border: `1px solid ${badgeColor}`,
                      borderRadius: "20px",
                      padding: "0.2rem 0.6rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {isLowMatch ? "< 10% compatibility" : `${score}% compatibility`}
                  </div>
                )}

                <h3 style={{ margin: 0, paddingRight: (score !== undefined || isLowMatch) ? "130px" : "0" }}>
                  {job.title}
                </h3>
                <p style={{ color: "#aaa", fontSize: "0.9rem", margin: 0 }}>
                  {job.company_name || "Confidential Company"}
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
                    {job.is_remote ? "Remote" : job.location || "On-site"}
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
                    backgroundColor: score !== undefined ? "#646cff" : isLowMatch ? "#3a1a1a" : "#3a3a3a",
                    color: "#fff",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  View Details
                </Link>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "2rem" }}>
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            style={{ ...SELECT_STYLE, padding: "0.4rem 0.8rem", opacity: page === 1 ? 0.4 : 1 }}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              style={{
                ...SELECT_STYLE,
                padding: "0.4rem 0.7rem",
                background: p === page ? "#646cff" : "#1a1a1a",
                border: p === page ? "1px solid #646cff" : "1px solid #444",
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            style={{ ...SELECT_STYLE, padding: "0.4rem 0.8rem", opacity: page === totalPages ? 0.4 : 1 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
