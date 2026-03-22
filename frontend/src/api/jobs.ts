import API from "./auth";

export interface SkillDetail {
  id: number;
  name: string;
  category: number;
  category_name: string;
}

export interface JobList {
  id: number;
  title: string;
  company_name: string;
  category: number;
  category_name: string;
  job_type: string;
  experience_level: string;
  location: string;
  is_remote: boolean;
  created_at: string;
}

export interface JobDetail extends JobList {
  description: string;
  required_skills: SkillDetail[];
  preferred_skills: SkillDetail[];
  category_detail: {
    id: number;
    name: string;
    description: string;
  };
  is_active: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getJobs = async (): Promise<JobList[]> => {
  const { data } = await API.get<PaginatedResponse<JobList> | JobList[]>(
    "/jobs/"
  );
  return Array.isArray(data) ? data : data.results;
};

export const getJobDetail = async (id: number): Promise<JobDetail> => {
  const { data } = await API.get<JobDetail>(`/jobs/${id}/`);
  return data;
};