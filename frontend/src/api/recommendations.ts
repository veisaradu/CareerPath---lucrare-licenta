import API from "./auth";

export interface Recommendation {
  id: number;
  job: number;
  job_detail: {
    id: number;
    title: string;
    company_name: string;
    job_type: string;
    experience_level: string;
    location: string;
    is_remote: boolean;
  };
  match_score: number;
  matched_skills_json: string[];
  skill_gap_json: string[];
  explanation: string;
  created_at: string;
  cv: number;
}

export interface Roadmap {
  id: number;
  target_job: number;
  target_job_detail: {
    id: number;
    title: string;
    company_name: string;
  };
  recommendation: number;
  steps_json: RoadmapStep[];
  estimated_total_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoadmapStep {
  order: number;
  skill: string;
  action: string;
  resource_url: string;
  estimated_hours: number;
  priority: "high" | "medium" | "low";
}

export const getRecommendations = async (): Promise<Recommendation[]> => {
  const { data } = await API.get<
    { results: Recommendation[] } | Recommendation[]
  >("/recommendations/");
  return Array.isArray(data) ? data : data.results;
};

export const generateRoadmap = async (
  recommendationId: number
): Promise<Roadmap> => {
  const { data } = await API.post<Roadmap>(
    `/recommendations/${recommendationId}/generate-roadmap/`
  );
  return data;
};