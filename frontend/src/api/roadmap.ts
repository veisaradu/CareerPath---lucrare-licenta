import API from "./auth";
import type { Roadmap } from "./recommendations";

export const getRoadmaps = async (): Promise<Roadmap[]> => {
  const { data } = await API.get<{ results: Roadmap[] } | Roadmap[]>(
    "/roadmaps/"
  );
  return Array.isArray(data) ? data : data.results;
};