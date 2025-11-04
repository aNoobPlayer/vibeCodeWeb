import { useEffect } from "react";
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
import { insertTipSchema, type Tip } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { z } from "zod";

const formSchema = insertTipSchema.extend({
  title: insertTipSchema.shape.title.min(1, "Title is required"),
  content: insertTipSchema.shape.content.min(1, "Content is required"),
});

type FormData = z.infer<typeof formSchema>;

interface TipFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tip?: Tip;
}

export function TipFormModal({ open, onOpenChange, tip }: TipFormModalProps) {
  const { toast } = useToast();
  const isEdit = !!tip;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: tip?.title || "",
      skill: tip?.skill || "Reading",
      content: tip?.content || "",
      status: tip?.status || "published",
      priority: tip?.priority || "medium",
    },
  });

  // Reset form when tip prop changes or dialog closes
  useEffect(() => {
    if (open) {
      form.reset({
        title: tip?.title || "",
        skill: tip?.skill || "Reading",
        content: tip?.content || "",
        status: tip?.status || "published",
        priority: tip?.priority || "medium",
      });
    }
  }, [tip, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit) {
        return apiRequest(`/api/tips/${tip.id}`, "PATCH", data);
      } else {
        return apiRequest("/api/tips", "POST", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tips"] });
      toast({
        title: isEdit ? "Tip updated" : "Tip created",
        description: `The tip has been ${isEdit ? "updated" : "created"} successfully.`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save tip",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tip" : "Create New Tip"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the tip details below" : "Fill in the details to create a new tip"}
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
                    <Input data-testid="input-tip-title" placeholder="e.g., How to improve reading speed" {...field} />
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
                        <SelectTrigger data-testid="select-tip-skill">
                          <SelectValue placeholder="Select skill" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Reading">Reading</SelectItem>
                        <SelectItem value="Listening">Listening</SelectItem>
                        <SelectItem value="Speaking">Speaking</SelectItem>
                        <SelectItem value="Writing">Writing</SelectItem>
                        <SelectItem value="GrammarVocabulary">Grammar & Vocabulary</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "medium"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tip-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tip-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Content *</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="input-tip-content"
                      placeholder="Write your tip content here..."
                      className="min-h-[200px]"
                      {...field}
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
                {mutation.isPending ? "Saving..." : isEdit ? "Update Tip" : "Create Tip"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
