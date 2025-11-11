import { useSyncExternalStore } from "react";
import { DEFAULT_QUESTION_TEMPLATES } from "@/data/questionTemplates";
import type { QuestionTemplate } from "@/types/questionTemplate";

const STORAGE_KEY = "aptis.questionTemplates";

type Subscriber = () => void;

let templatesCache: QuestionTemplate[] = loadFromStorage();
const subscribers = new Set<Subscriber>();

function loadFromStorage(): QuestionTemplate[] {
  if (typeof window === "undefined") return DEFAULT_QUESTION_TEMPLATES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_QUESTION_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_QUESTION_TEMPLATES;
    return parsed;
  } catch {
    return DEFAULT_QUESTION_TEMPLATES;
  }
}

function persist(next: QuestionTemplate[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors (e.g., quota exceeded)
  }
}

function setTemplates(next: QuestionTemplate[]) {
  templatesCache = next;
  persist(next);
  subscribers.forEach((cb) => cb());
}

function subscribe(listener: Subscriber) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function getSnapshot() {
  return templatesCache;
}

function ensureCache() {
  if (templatesCache.length === 0) {
    templatesCache = DEFAULT_QUESTION_TEMPLATES;
  }
  return templatesCache;
}

function generateId() {
  const random = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
  return `tmpl-${random}`;
}

export function useQuestionTemplates() {
  const templates = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addTemplate = (template: Omit<QuestionTemplate, "id" | "createdAt">) => {
    const next: QuestionTemplate[] = [
      ...ensureCache(),
      { ...template, id: generateId(), createdAt: new Date().toISOString() },
    ];
    setTemplates(next);
  };

  const updateTemplate = (id: string, patch: Partial<QuestionTemplate>) => {
    setTemplates(
      ensureCache().map((template) =>
        template.id === id ? { ...template, ...patch, updatedAt: new Date().toISOString() } : template,
      ),
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates(ensureCache().filter((template) => template.id !== id));
  };

  const duplicateTemplate = (id: string) => {
    const template = ensureCache().find((t) => t.id === id);
    if (!template) return;
    const copy = {
      ...template,
      id: generateId(),
      label: `${template.label} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: undefined,
    };
    setTemplates([...ensureCache(), copy]);
  };

  const resetTemplates = () => {
    setTemplates(DEFAULT_QUESTION_TEMPLATES);
  };

  return {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    resetTemplates,
  };
}
