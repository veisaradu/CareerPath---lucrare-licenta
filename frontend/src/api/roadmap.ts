import API from "./auth";
import type { Roadmap } from "./recommendations";

export const getRoadmaps = async (): Promise<Roadmap[]> => {
  const { data } = await API.get<{ results: Roadmap[] } | Roadmap[]>(
    "/roadmaps/"
  );
  return Array.isArray(data) ? data : data.results;
};

export const completeStep = async (
  roadmapId: number,
  stepOrder: number
): Promise<number[]> => {
  const { data } = await API.post<{ completed_steps: number[] }>(
    `/roadmaps/${roadmapId}/complete-step/`,
    { step_order: stepOrder }
  );
  return data.completed_steps;
};

export const uncompleteStep = async (
  roadmapId: number,
  stepOrder: number
): Promise<number[]> => {
  const { data } = await API.post<{ completed_steps: number[] }>(
    `/roadmaps/${roadmapId}/uncomplete-step/`,
    { step_order: stepOrder }
  );
  return data.completed_steps;
};