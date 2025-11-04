import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertQuestionSchema, type Question } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { z } from "zod";

const formSchema = insertQuestionSchema.extend({
  title: insertQuestionSchema.shape.title.min(1, "Title is required"),
  content: insertQuestionSchema.shape.content.min(1, "Question content is required"),
});

type FormData = z.infer<typeof formSchema>;

interface QuestionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question;
}

export function QuestionFormModal({ open, onOpenChange, question }: QuestionFormModalProps) {
  const { toast } = useToast();
  const isEdit = !!question;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: question?.title || "",
      skill: question?.skill || "Reading",
      type: question?.type || "mcq_single",
      content: question?.content || "",
      points: question?.points || 1,
      options: question?.options || [],
      correctAnswers: question?.correctAnswers || [],
      explanation: question?.explanation || "",
      mediaUrl: question?.mediaUrl || "",
      tags: question?.tags || [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit) {
        return apiRequest(`/api/questions/${question.id}`, "PATCH", data);
      } else {
        return apiRequest("/api/questions", "POST", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: isEdit ? "Question updated" : "Question created",
        description: `The question has been ${isEdit ? "updated" : "created"} successfully.`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save question",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Question" : "Create New Question"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the question details below" : "Fill in the details to create a new question"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input data-testid="input-question-title" placeholder="e.g., Question 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="skill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-question-skill">
                          <SelectValue placeholder="Select skill" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Reading">Reading</SelectItem>
                        <SelectItem value="Listening">Listening</SelectItem>
                        <SelectItem value="Speaking">Speaking</SelectItem>
                        <SelectItem value="Writing">Writing</SelectItem>
                        <SelectItem value="GrammarVocabulary">Grammar & Vocabulary</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-question-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mcq_single">Multiple Choice (Single)</SelectItem>
                        <SelectItem value="mcq_multi">Multiple Choice (Multi)</SelectItem>
                        <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                        <SelectItem value="writing_prompt">Writing Prompt</SelectItem>
                        <SelectItem value="speaking_prompt">Speaking Prompt</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-question-points"
                        type="number"
                        placeholder="1"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Content *</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="input-question-content"
                      placeholder="Enter the question content here..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="input-question-explanation"
                      placeholder="Explain why this is the correct answer..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : isEdit ? "Update Question" : "Create Question"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
