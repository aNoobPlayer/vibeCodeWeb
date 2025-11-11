import type { Question } from "@shared/schema";

export type QuestionTemplate = {
  id: string;
  label: string;
  description: string;
  skills: Question["skill"][];
  types: Question["type"][];
  content: string;
  correctAnswers?: string[];
  options?: string[];
  tags?: string[];
  difficulty?: "easy" | "medium" | "hard";
  createdAt: string;
  updatedAt?: string;
};
