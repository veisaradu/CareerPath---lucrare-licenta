import API from "./auth";

export interface UserProfile {
  id: number;
  user: number;
  education_level: string;
  education_details: unknown[];
  interests: string;
  experience_years: number;
  experience_details: unknown[];
  preferred_categories: number[];
  desired_role: string;
  open_to_remote: boolean;
  location: string;
  ai_summary: string;
  updated_at: string;
}

export interface UserAccount {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
  skill_proficiencies: UserSkillProficiency[];
}

export interface UserSkillProficiency {
  id: number;
  user: number;
  skill: number;
  skill_name: string;
  skill_category: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  source: "manual" | "cv" | "ai";
  years_experience: number;
}

export interface Skill {
  id: number;
  name: string;
  category: number | null;
  category_name: string;
}

export interface CV {
  id: number;
  user: number;
  file: string;
  uploaded_at: string;
  is_processed: boolean;
  is_active: boolean;
  extracted_skills_json: unknown[] | null;
}

export const getMyAccount = async (): Promise<UserAccount> => {
  const { data } = await API.get<UserAccount>("/users/accounts/me/");
  return data;
};

export const updateProfile = async (
  payload: Partial<UserProfile>
): Promise<UserProfile> => {
  const { data } = await API.patch<UserProfile>(
    "/users/profiles/me/",
    payload
  );
  return data;
};

export const getMySkills = async (): Promise<UserSkillProficiency[]> => {
  const { data } = await API.get<
    { results: UserSkillProficiency[] } | UserSkillProficiency[]
  >("/users/skill-proficiencies/");
  return Array.isArray(data) ? data : data.results;
};

export const addSkill = async (payload: {
  skill: number;
  level: UserSkillProficiency["level"];
  years_experience: number;
}): Promise<UserSkillProficiency> => {
  const { data } = await API.post<UserSkillProficiency>(
    "/users/skill-proficiencies/",
    payload
  );
  return data;
};

export const deleteSkill = async (id: number): Promise<void> => {
  await API.delete(`/users/skill-proficiencies/${id}/`);
};

export const getAllSkills = async (): Promise<Skill[]> => {
  const { data } = await API.get<{ results: Skill[] } | Skill[]>("/skills/");
  return Array.isArray(data) ? data : data.results;
};

export const getMyCVs = async (): Promise<CV[]> => {
  const { data } = await API.get<{ results: CV[] } | CV[]>("/cvs/");
  return Array.isArray(data) ? data : data.results;
};

export const uploadCV = async (file: File): Promise<CV> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await API.post<CV>("/cvs/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deleteCV = async (id: number): Promise<void> => {
  await API.delete(`/cvs/${id}/`);
};