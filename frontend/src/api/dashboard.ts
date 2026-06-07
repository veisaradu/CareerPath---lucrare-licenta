import API from "./auth";

export interface DashboardStats {
  cv_status: "none" | "uploaded" | "processed";
  cv_id: number | null;
  recommendations_count: number;
  top_match_score: number | null;
  skills_count: number;
  active_roadmaps_count: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [cvs, recommendations, skills, roadmaps] = await Promise.all([
    API.get("/cvs/").then((r) => r.data),
    API.get("/recommendations/").then((r) => r.data),
    API.get("/users/skill-proficiencies/").then((r) => r.data),
    API.get("/roadmaps/").then((r) => r.data),
  ]);

  const cvList = Array.isArray(cvs) ? cvs : cvs.results ?? [];
  const recList = Array.isArray(recommendations)
    ? recommendations
    : recommendations.results ?? [];
  const recommendationsCount = Array.isArray(recommendations)
    ? recommendations.length
    : recommendations.count ?? recommendations.results?.length ?? 0;
  const skillList = Array.isArray(skills) ? skills : skills.results ?? [];
  const roadmapList = Array.isArray(roadmaps)
    ? roadmaps
    : roadmaps.results ?? [];

  const activeCV = cvList.find((c: { is_active: boolean }) => c.is_active);

  let cv_status: DashboardStats["cv_status"] = "none";
  if (activeCV?.is_processed) cv_status = "processed";
  else if (activeCV) cv_status = "uploaded";

  const scores = recList.map(
    (r: { match_score: number }) => r.match_score
  );

  return {
    cv_status,
    cv_id: activeCV?.id ?? null,
    recommendations_count: recommendationsCount,
    top_match_score: scores.length ? Math.max(...scores) : null,
    skills_count: skillList.length,
    active_roadmaps_count: roadmapList.filter(
      (r: { is_active: boolean }) => r.is_active
    ).length,
  };
};