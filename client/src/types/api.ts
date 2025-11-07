import type { Question } from "@shared/schema";

export type QuestionsResponse = {
  items: Question[];
  page: number;
  size: number;
  total: number;
  hasMore: boolean;
};
