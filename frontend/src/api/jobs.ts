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

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface JobFilters {
  job_type?: string;
  experience_level?: string;
  is_remote?: boolean;
  category?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getJobs = async (filters?: JobFilters, page = 1): Promise<PaginatedResponse<JobList>> => {
  const params = new URLSearchParams();
  if (filters?.job_type) params.append("job_type", filters.job_type);
  if (filters?.experience_level) params.append("experience_level", filters.experience_level);
  if (filters?.is_remote !== undefined) params.append("is_remote", String(filters.is_remote));
  if (filters?.category) params.append("category", String(filters.category));
  if (filters?.search) params.append("search", filters.search);
  params.append("page", String(page));

  const { data } = await API.get<PaginatedResponse<JobList>>(`/jobs/?${params.toString()}`);
  return data;
};

export const getJobDetail = async (id: number): Promise<JobDetail> => {
  const { data } = await API.get<JobDetail>(`/jobs/${id}/`);
  return data;
};

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await API.get<PaginatedResponse<Category> | Category[]>("/categories/");
  return Array.isArray(data) ? data : data.results;
};