import React, { useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Edit, Trash2, Calendar, Monitor, Link as LinkIcon, ExternalLink, Check, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetBug, 
  useDeleteBug,
  useUpdateBug,
  getGetBugQueryKey,
  getListBugsQueryKey,
  getGetBugStatsQueryKey,
  getGetRecentBugsQueryKey,
  BugStatus
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge, SeverityBadge, StatusBadge } from "@/components/bug-badges";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BugDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/bugs/:id");
  const bugId = Number(params?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bug, isLoading } = useGetBug(bugId, {
    query: {
      enabled: !!bugId,
      queryKey: getGetBugQueryKey(bugId),
    }
  });

  const deleteMutation = useDeleteBug();
  const updateMutation = useUpdateBug();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    deleteMutation.mutate(
      { id: bugId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBugsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBugStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentBugsQueryKey() });
          toast({
            title: "Bug deleted",
            description: "The bug report has been removed.",
          });
          setLocation("/bugs");
        },
        onError: () => {
          setIsDeleting(false);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete bug. Please try again.",
          });
        }
      }
    );
  };

  const handleStatusChange = (newStatus: string) => {
    if (!bug) return;
    
    updateMutation.mutate(
      { id: bugId, data: { status: newStatus as BugStatus } },
      {
        onSuccess: (updatedBug) => {
          queryClient.setQueryData(getGetBugQueryKey(bugId), updatedBug);
          queryClient.invalidateQueries({ queryKey: getListBugsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBugStatsQueryKey() });
          toast({
            title: "Status updated",
            description: `Bug status changed to ${newStatus}.`,
          });
        }
      }
    );
  };

  const toggleSubmissionStatus = () => {
    if (!bug) return;
    
    updateMutation.mutate(
      { id: bugId, data: { submittedToForm: !bug.submittedToForm } },
      {
        onSuccess: (updatedBug) => {
          queryClient.setQueryData(getGetBugQueryKey(bugId), updatedBug);
          toast({
            title: "Submission status updated",
            description: updatedBug.submittedToForm ? "Marked as submitted to Google Form." : "Marked as NOT submitted to Google Form.",
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="text-4xl font-bold text-muted-foreground">404</div>
        <p className="text-xl">Bug not found</p>
        <Button asChild variant="outline">
          <Link href="/bugs">Return to Bugs List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" className="w-fit -ml-4" asChild>
          <Link href="/bugs" data-testid="btn-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bugs
          </Link>
        </Button>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="outline" asChild>
            <Link href={`/bugs/${bugId}/edit`} data-testid="btn-edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-testid="btn-delete">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the bug report.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Bug Title & Core Badges */}
      <div className="space-y-4 border-b pb-6">
        <div className="flex items-center gap-3 font-mono text-muted-foreground text-sm">
          <span className="bg-muted px-2 py-1 rounded-md text-foreground font-medium border" data-testid="bug-id">
            BUG-{bugId.toString().padStart(4, '0')}
          </span>
          <span className="flex items-center gap-1.5" title="Created At">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(bug.createdAt), "MMM d, yyyy h:mm a")}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight" data-testid="bug-title">
          {bug.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <CategoryBadge category={bug.category} />
          <SeverityBadge severity={bug.severity} />
          
          {/* Status Dropdown - Editable inline */}
          <div className="flex items-center gap-2">
            <Select 
              value={bug.status} 
              onValueChange={handleStatusChange}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className="h-7 px-2 py-1 text-xs border-none bg-transparent hover:bg-accent focus:ring-0 focus:ring-offset-0 w-auto shadow-none data-[state=open]:bg-accent" data-testid="select-status-inline">
                <StatusBadge status={bug.status} />
              </SelectTrigger>
              <SelectContent align="end">
                {Object.values(BugStatus).map((stat) => (
                  <SelectItem key={stat} value={stat} className="text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        stat === 'Confirmed' ? 'bg-green-500' :
                        stat === 'Invalid' ? 'bg-red-500' :
                        stat === 'Duplicate' ? 'bg-purple-500' :
                        stat === 'Submitted' ? 'bg-blue-500' : 'bg-slate-400'
                      }`} />
                      {stat}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-8">
          <section className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              Environment
            </h3>
            <Card>
              <CardContent className="p-4 font-mono text-sm bg-muted/30">
                {bug.environment}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Steps to Reproduce</h3>
            <Card>
              <CardContent className="p-5 bg-card prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm m-0 bg-transparent border-0 p-0 text-foreground">
                  {bug.stepsToReproduce}
                </pre>
              </CardContent>
            </Card>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-500">Expected Behaviour</h3>
              <Card className="h-full border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-900/10">
                <CardContent className="p-5">
                  <p className="text-sm whitespace-pre-wrap">{bug.expectedBehaviour}</p>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-500">Actual Behaviour</h3>
              <Card className="h-full border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10">
                <CardContent className="p-5">
                  <p className="text-sm whitespace-pre-wrap">{bug.actualBehaviour}</p>
                </CardContent>
              </Card>
            </section>
          </div>

          {(bug.rootCause || bug.suggestedFix) && (
            <>
              <Separator />
              <div className="space-y-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Technical Analysis
                </h3>
                
                {bug.rootCause && (
                  <section className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Root Cause Hypothesis</h4>
                    <div className="text-sm bg-muted/50 p-4 rounded-lg border border-border/50">
                      {bug.rootCause}
                    </div>
                  </section>
                )}

                {bug.suggestedFix && (
                  <section className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Suggested Fix</h4>
                    <div className="text-sm bg-muted/50 p-4 rounded-lg border border-border/50 font-mono">
                      {bug.suggestedFix}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar / Metadata */}
        <div className="space-y-6">
          <Card className={`border-2 ${bug.submittedToForm ? 'border-green-500/50 dark:border-green-500/30 bg-green-50/50 dark:bg-green-900/10' : 'border-dashed'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Maya Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button 
                  variant={bug.submittedToForm ? "default" : "outline"} 
                  className={`w-full justify-start ${bug.submittedToForm ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                  onClick={toggleSubmissionStatus}
                  disabled={updateMutation.isPending}
                  data-testid="btn-toggle-submitted"
                >
                  {bug.submittedToForm ? (
                    <><Check className="mr-2 h-4 w-4" /> Submitted to Form</>
                  ) : (
                    "Mark as Submitted"
                  )}
                </Button>
                
                {!bug.submittedToForm && (
                  <Button variant="link" asChild className="px-0 h-auto text-primary justify-start">
                    <a href="https://forms.gle/hKJvPS6cnwzhDL986" target="_blank" rel="noopener noreferrer">
                      Open Google Form <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
              </div>

              {bug.submittedToForm && bug.formSubmissionUrl && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1.5 uppercase font-medium tracking-wider">Proof of Submission</p>
                  <a 
                    href={bug.formSubmissionUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 truncate"
                  >
                    <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{bug.formSubmissionUrl}</span>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono">BUG-{bug.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(bug.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{format(new Date(bug.updatedAt), "MMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
