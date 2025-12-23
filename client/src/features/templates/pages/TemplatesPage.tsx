import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TemplateFormModal, type TemplateFormData } from "@/components/TemplateFormModal";
import type { Question, QuestionTemplate } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useTemplates } from "@/features/templates/hooks/useTemplates";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { Sparkles, Plus, Loader2 } from "lucide-react";

type TemplateOptionValue = string | { key?: string; text?: string };

type NormalizedTemplateOption = {
  value: string;
  label: string;
  key: string;
};

function normalizeTemplateOptions(options?: TemplateOptionValue[] | null): NormalizedTemplateOption[] {
  if (!Array.isArray(options)) return [];
  return options
    .map((option, index) => {
      if (typeof option === "string") {
        const fallbackKey = option || `option-${index}`;
        return { value: option, label: option, key: fallbackKey };
      }
      const text = typeof option?.text === "string" ? option.text : "";
      const key = typeof option?.key === "string" ? option.key : "";
      const label = text || key;
      const value = key || text;
      const optionKey = key || text || `option-${index}`;
      if (!label && !value) return null;
      return { value, label, key: optionKey };
    })
    .filter((option): option is NormalizedTemplateOption => Boolean(option));
}

function normalizeTemplateAnswers(answers?: TemplateOptionValue[] | null): string[] {
  if (!Array.isArray(answers)) return [];
  return answers
    .map((answer) => {
      if (typeof answer === "string") return answer;
      const key = typeof answer?.key === "string" ? answer.key : "";
      const text = typeof answer?.text === "string" ? answer.text : "";
      return key || text;
    })
    .filter((answer) => answer.trim().length > 0);
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const { templates, isLoading: templatesLoading } = useTemplates();
  const [search, setSearch] = useState("");
  const [skillFilters, setSkillFilters] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestionTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (skillFilters.length && !template.skills.some((skill) => skillFilters.includes(skill))) return false;
      if (typeFilter !== "all" && !template.types.includes(typeFilter as Question["type"])) return false;
      if (search) {
        const haystack = `${template.label} ${template.description} ${template.content}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [templates, skillFilters, typeFilter, search]);

  const skillOptions = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      t.skills.forEach((skill) => set.add(skill));
    });
    return Array.from(set).sort();
  }, [templates]);

  const toggleSkillFilter = (skill: string) => {
    setSkillFilters((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const clearSkillFilters = () => setSkillFilters([]);

  const saveTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: TemplateFormData }) => {
      if (id) {
        await apiRequest(`/api/templates/${id}`, "PATCH", data);
      } else {
        await apiRequest("/api/templates", "POST", data);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      toast({
        title: variables.id ? "Template updated" : "Template created",
        description: variables.id
          ? "Your changes are now available in the question builder."
          : "Template added to the shared library.",
      });
      setModalOpen(false);
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save template",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (template: QuestionTemplate) => apiRequest(`/api/templates/${template.id}`, "DELETE"),
    onSuccess: (_, template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      toast({ title: "Template removed", description: `"${template.label}" was deleted.` });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete template",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: (template: QuestionTemplate) =>
      apiRequest("/api/templates", "POST", {
        label: `${template.label} (copy)`,
        description: template.description,
        skills: template.skills,
        types: template.types,
        content: template.content,
        options: template.options,
        correctAnswers: template.correctAnswers,
        tags: template.tags,
        difficulty: template.difficulty,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      toast({ title: "Template duplicated", description: "Feel free to tweak the copy." });
    },
  });

  const resetTemplatesMutation = useMutation({
    mutationFn: () => apiRequest("/api/templates/reset", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      toast({ title: "Templates reset", description: "Restored the default library." });
    },
  });

  const handleSaveTemplate = async (data: TemplateFormData) => {
    await saveTemplateMutation.mutateAsync({ id: editingTemplate?.id, data });
  };

  const handleDelete = (template: QuestionTemplate) => {
    const confirmed = window.confirm(`Delete "${template.label}"? This cannot be undone.`);
    if (!confirmed) return;
    deleteTemplateMutation.mutate(template);
  };

  return (
    <div className="space-y-6 animate-slideIn">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Template studio</h1>
          <p className="text-gray-600 max-w-2xl">
            Build reusable prompts, answer sets, and guidance so question authors can move faster.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              const confirmed = window.confirm("Reset to the default template library?");
              if (!confirmed) return;
              resetTemplatesMutation.mutate();
            }}
            disabled={resetTemplatesMutation.isPending}
          >
            {resetTemplatesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Restore defaults
          </Button>
          <Button
            onClick={() => {
              setEditingTemplate(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New template
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white px-3 py-2">
            {skillOptions.map((skill) => {
              const active = skillFilters.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkillFilter(skill)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500"
                  }`}
                >
                  {skill}
                </button>
              );
            })}
            {skillOptions.length > 0 && (
              <button type="button" className="text-xs text-gray-400 underline" onClick={clearSkillFilters}>
                Clear
              </button>
            )}
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="mcq_single">MCQ (single)</SelectItem>
              <SelectItem value="mcq_multi">MCQ (multi)</SelectItem>
              <SelectItem value="fill_blank">Fill in the blank</SelectItem>
              <SelectItem value="writing_prompt">Writing prompt</SelectItem>
              <SelectItem value="speaking_prompt">Speaking prompt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="rounded-2xl border border-gray-200 bg-white/80 min-h-[200px]">
        {templatesLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading templates...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No templates match your filters.</div>
        ) : (
          <ScrollArea className="max-h-[65vh] pr-2">
            <div className="space-y-4 p-4 pr-4">
              {filteredTemplates.map((template) => {
                const options = normalizeTemplateOptions(template.options as TemplateOptionValue[] | undefined);
                const correctAnswers = normalizeTemplateAnswers(template.correctAnswers as TemplateOptionValue[] | undefined);
                const correctAnswerSet = new Set(correctAnswers);
                const hasOptions = options.length > 0;
                const showExpected = !hasOptions && correctAnswers.length > 0;
                return (
                  <Card key={template.id} className="p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-900">{template.label}</h3>
                          {template.skills.map((skill) => (
                            <Badge key={`${template.id}-${skill}`} variant="secondary" className="bg-gray-100 text-gray-700">
                              {skill}
                            </Badge>
                          ))}
                          {template.difficulty && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                              {template.difficulty}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{template.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                          {template.types.map((type) => (
                            <span key={type} className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                              {type}
                            </span>
                          ))}
                          {(template.tags ?? []).map((tag) => (
                            <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTemplate(template);
                            setModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => duplicateTemplateMutation.mutate(template)}>
                          Duplicate
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(template)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                    <pre className="rounded-xl bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
                      {template.content}
                    </pre>
                    {hasOptions && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800">Options</p>
                        <ul className="grid gap-2 md:grid-cols-2">
                          {options.map((option, index) => {
                            const isCorrect =
                              correctAnswerSet.has(option.value) ||
                              correctAnswerSet.has(option.label) ||
                              correctAnswerSet.has(option.key);
                            return (
                              <li
                                key={`${template.id}-option-${index}`}
                                className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700"
                              >
                                <span>
                                  <span className="mr-2 font-semibold text-gray-900">
                                    {String.fromCharCode(65 + index)}.
                                  </span>
                                  {option.label}
                                </span>
                                {isCorrect && (
                                  <Badge variant="outline" className="border-emerald-200 text-emerald-600">
                                    Correct
                                  </Badge>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {showExpected && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        Expected answer: {correctAnswers.join(", ")}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <TemplateFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSubmit={handleSaveTemplate}
        submitting={saveTemplateMutation.isPending}
        title={editingTemplate ? "Update template" : "New template"}
        description="Store the full prompt, answer patterns, and guidance for re-use."
      />
    </div>
  );
}
