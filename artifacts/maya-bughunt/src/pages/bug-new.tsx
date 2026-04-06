import React from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateBug, 
  useGetBug, 
  useUpdateBug,
  getGetBugQueryKey,
  getListBugsQueryKey,
  getGetBugStatsQueryKey,
  getGetRecentBugsQueryKey,
  BugCategory, 
  BugSeverity, 
  BugStatus 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  category: z.nativeEnum(BugCategory),
  severity: z.nativeEnum(BugSeverity),
  status: z.nativeEnum(BugStatus),
  environment: z.string().min(2, "Environment is required"),
  stepsToReproduce: z.string().min(10, "Steps to reproduce are required"),
  expectedBehaviour: z.string().min(5, "Expected behaviour is required"),
  actualBehaviour: z.string().min(5, "Actual behaviour is required"),
  rootCause: z.string().optional().nullable(),
  suggestedFix: z.string().optional().nullable(),
  submittedToForm: z.boolean().default(false),
  formSubmissionUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function BugForm() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/bugs/:id/edit");
  const isEditing = match;
  const bugId = isEditing ? Number(params?.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bug, isLoading: isBugLoading } = useGetBug(bugId!, {
    query: {
      enabled: isEditing && !!bugId,
      queryKey: getGetBugQueryKey(bugId!),
    },
  });

  const createMutation = useCreateBug();
  const updateMutation = useUpdateBug();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: BugCategory.UI,
      severity: BugSeverity.Medium,
      status: BugStatus.Draft,
      environment: "Chrome / macOS / Next.js Desktop",
      stepsToReproduce: "1. \n2. \n3. ",
      expectedBehaviour: "",
      actualBehaviour: "",
      rootCause: "",
      suggestedFix: "",
      submittedToForm: false,
      formSubmissionUrl: "",
    },
  });

  // Load existing data
  React.useEffect(() => {
    if (bug && isEditing) {
      form.reset({
        title: bug.title,
        category: bug.category,
        severity: bug.severity,
        status: bug.status,
        environment: bug.environment,
        stepsToReproduce: bug.stepsToReproduce,
        expectedBehaviour: bug.expectedBehaviour,
        actualBehaviour: bug.actualBehaviour,
        rootCause: bug.rootCause || "",
        suggestedFix: bug.suggestedFix || "",
        submittedToForm: bug.submittedToForm,
        formSubmissionUrl: bug.formSubmissionUrl || "",
      });
    }
  }, [bug, isEditing, form]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      rootCause: values.rootCause || null,
      suggestedFix: values.suggestedFix || null,
      formSubmissionUrl: values.formSubmissionUrl || null,
    };

    if (isEditing && bugId) {
      updateMutation.mutate(
        { id: bugId, data: payload },
        {
          onSuccess: (updatedBug) => {
            queryClient.setQueryData(getGetBugQueryKey(bugId), updatedBug);
            queryClient.invalidateQueries({ queryKey: getListBugsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetBugStatsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetRecentBugsQueryKey() });
            toast({
              title: "Bug updated",
              description: "The bug report has been successfully updated.",
            });
            setLocation(`/bugs/${bugId}`);
          },
          onError: () => {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to update bug report. Please try again.",
            });
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: (newBug) => {
            queryClient.invalidateQueries({ queryKey: getListBugsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetBugStatsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetRecentBugsQueryKey() });
            toast({
              title: "Bug created",
              description: "New bug report has been successfully created.",
            });
            setLocation(`/bugs/${newBug.id}`);
          },
          onError: () => {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create bug report. Please try again.",
            });
          },
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isBugLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6 space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation(isEditing ? `/bugs/${bugId}` : "/bugs")} data-testid="btn-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? "Edit Bug Report" : "Report New Bug"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? `BUG-${bugId?.toString().padStart(4, '0')}` : "Document a new issue with precision"}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Core Information</CardTitle>
              <CardDescription>Primary details about the bug</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief, clear summary of the issue" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(BugCategory).map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-severity">
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(BugSeverity).map((sev) => (
                            <SelectItem key={sev} value={sev}>{sev}</SelectItem>
                          ))}
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(BugStatus).map((stat) => (
                            <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment</FormLabel>
                    <FormControl>
                      <Input placeholder="Browser / OS / Device" {...field} data-testid="input-environment" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reproduction Details</CardTitle>
              <CardDescription>Step-by-step guide to reproduce the issue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="stepsToReproduce"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Steps to Reproduce</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="min-h-[120px] font-mono text-sm" 
                        placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..." 
                        {...field} 
                        data-testid="textarea-steps" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="expectedBehaviour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Behaviour</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[100px]" 
                          placeholder="What should have happened?" 
                          {...field} 
                          data-testid="textarea-expected" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="actualBehaviour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Behaviour</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[100px]" 
                          placeholder="What actually happened?" 
                          {...field} 
                          data-testid="textarea-actual" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical Analysis <span className="text-muted-foreground font-normal text-sm ml-2">(Optional)</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="rootCause"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Root Cause Hypothesis</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="min-h-[80px]" 
                        placeholder="Why do you think this is happening?" 
                        {...field} 
                        value={field.value || ""}
                        data-testid="textarea-root-cause" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suggestedFix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suggested Fix</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="min-h-[80px]" 
                        placeholder="How would you solve this?" 
                        {...field} 
                        value={field.value || ""}
                        data-testid="textarea-suggested-fix" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maya Bug Hunt Challenge</CardTitle>
              <CardDescription>
                Track if you've submitted this bug to the official Maya challenge form.
                <a 
                  href="https://forms.gle/hKJvPS6cnwzhDL986" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-1 inline-flex items-center"
                >
                  Open Official Form <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="submittedToForm"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Submitted to Official Form</FormLabel>
                      <FormDescription>
                        Toggle this once you have successfully submitted this bug to Maya's Google Form.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-submitted"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("submittedToForm") && (
                <FormField
                  control={form.control}
                  name="formSubmissionUrl"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-top-2">
                      <FormLabel>Submission Proof URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Link to screenshot or video proof" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-submission-url" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
            <CardFooter className="bg-muted/50 flex justify-between items-center py-4 border-t">
              <Button type="button" variant="outline" onClick={() => setLocation(isEditing ? `/bugs/${bugId}` : "/bugs")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="btn-submit">
                {isPending ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? "Save Changes" : "Create Bug Report"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
