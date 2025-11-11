import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { QuestionTemplate } from "@/types/questionTemplate";
import type { Question } from "@shared/schema";

const templateSchema = z.object({
  label: z.string().min(1, "Label is required"),
  description: z.string().min(1, "Description is required"),
  skills: z.array(z.string()).min(1, "Select at least one skill focus"),
  types: z.array(z.string()).min(1, "Select at least one question type"),
  content: z.string().min(1, "Template content is required"),
  options: z.array(z.string().trim()).optional(),
  correctAnswers: z.array(z.string().trim()).optional(),
  tags: z.array(z.string().trim()).optional(),
});

export type TemplateFormData = z.infer<typeof templateSchema>;

const QUESTION_TYPES: { value: Question["type"]; label: string }[] = [
  { value: "mcq_single", label: "MCQ (single answer)" },
  { value: "mcq_multi", label: "MCQ (multiple answers)" },
  { value: "fill_blank", label: "Fill in the blank" },
  { value: "writing_prompt", label: "Writing prompt" },
  { value: "speaking_prompt", label: "Speaking prompt" },
];

const SKILL_OPTIONS = ["Reading", "Listening", "Speaking", "Writing", "GrammarVocabulary", "General"];

type TemplateFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TemplateFormData) => void;
  template?: QuestionTemplate | null;
  title?: string;
  description?: string;
};

export function TemplateFormModal({
  open,
  onOpenChange,
  onSubmit,
  template,
  title = "New template",
  description = "Save reusable text, answer options, and guidance for future questions.",
}: TemplateFormModalProps) {
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      label: "",
      description: "",
      skills: ["Reading"],
      types: ["mcq_single"],
      content: "",
      options: [],
      correctAnswers: [],
      tags: [],
    },
  });

  useEffect(() => {
    if (template && open) {
      form.reset({
        label: template.label,
        description: template.description,
        skills: template.skills,
        types: template.types,
        content: template.content,
        options: template.options ?? [],
        correctAnswers: template.correctAnswers ?? [],
        tags: template.tags ?? [],
      });
    } else if (!template && open) {
      form.reset({
        label: "",
        description: "",
        skills: ["Reading"],
        types: ["mcq_single"],
        content: "",
        options: [],
        correctAnswers: [],
        tags: [],
      });
    }
  }, [form, open, template]);

  const handleSubmit = (values: TemplateFormData) => {
    onSubmit(values);
    onOpenChange(false);
  };

  const toggleType = (type: Question["type"]) => {
    const curr = form.getValues("types");
    if (curr.includes(type)) {
      const next = curr.filter((t) => t !== type);
      form.setValue("types", next.length ? next : [type], { shouldDirty: true });
    } else {
      form.setValue("types", [...curr, type], { shouldDirty: true });
    }
  };

  const updateArrayField = (key: keyof Pick<TemplateFormData, "options" | "correctAnswers" | "tags">, value: string) => {
    const current = form.getValues(key) ?? [];
    if (!value.trim()) return;
    form.setValue(key, [...current, value.trim()], { shouldDirty: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? "Edit template" : title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template title</FormLabel>
                  <FormControl>
                    <Input placeholder="Listening - identify main idea" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe when to use this template..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => {
                  const currentSkills: string[] = field.value ?? [];
                  const handleToggle = (skill: string) => {
                    const next = currentSkills.includes(skill)
                      ? currentSkills.filter((s) => s !== skill)
                      : [...currentSkills, skill];
                    field.onChange(next.length ? next : ["General"]);
                  };
                  return (
                    <FormItem>
                      <FormLabel>Skill focus</FormLabel>
                      <div className="mt-2 grid gap-2">
                        {SKILL_OPTIONS.map((skill) => {
                          const active = currentSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => handleToggle(skill)}
                              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                                active ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-600"
                              }`}
                            >
                              {skill}
                              <span className="text-xs">{active ? "Selected" : "Select"}</span>
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <div>
                <FormLabel>Question types</FormLabel>
                <div className="mt-2 grid gap-2">
                  {QUESTION_TYPES.map((item) => {
                    const active = form.watch("types")?.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleType(item.value)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                          active ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {item.label}
                        <span className="text-xs">{active ? "Selected" : "Select"}</span>
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </div>
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template content</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[160px]"
                      placeholder="Add the question prompt, bullet list of instructions, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FieldListEditor
              label="Options"
              placeholder="Add answer choice"
              values={form.watch("options") ?? []}
              onAdd={(value) => updateArrayField("options", value)}
              onRemove={(index) => {
                const next = (form.watch("options") ?? []).filter((_, idx) => idx !== index);
                form.setValue("options", next, { shouldDirty: true });
              }}
            />

            <FieldListEditor
              label="Correct answers"
              placeholder="Add official answer"
              values={form.watch("correctAnswers") ?? []}
              onAdd={(value) => updateArrayField("correctAnswers", value)}
              onRemove={(index) => {
                const next = (form.watch("correctAnswers") ?? []).filter((_, idx) => idx !== index);
                form.setValue("correctAnswers", next, { shouldDirty: true });
              }}
            />

            <FieldListEditor
              label="Tags"
              placeholder="Add tag"
              values={form.watch("tags") ?? []}
              onAdd={(value) => updateArrayField("tags", value)}
              onRemove={(index) => {
                const next = (form.watch("tags") ?? []).filter((_, idx) => idx !== index);
                form.setValue("tags", next, { shouldDirty: true });
              }}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{template ? "Update template" : "Create template"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type FieldListEditorProps = {
  label: string;
  placeholder: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
};

function FieldListEditor({ label, placeholder, values, onAdd, onRemove }: FieldListEditorProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const target = event.target as HTMLInputElement;
      const value = target.value.trim();
      if (!value) return;
      onAdd(value);
      target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <FormLabel>{label}</FormLabel>
      <Input placeholder={placeholder} onKeyDown={handleKeyDown} />
      <div className="flex flex-wrap gap-2">
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="group inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
          >
            {value}
            <button
              type="button"
              className="text-gray-400 transition group-hover:text-gray-600"
              onClick={() => onRemove(index)}
            >
              x
            </button>
          </span>
        ))}
        {values.length === 0 && <span className="text-xs text-gray-400">No entries yet</span>}
      </div>
    </div>
  );
}
