import React from "react";
import { Link } from "wouter";
import { useGetBugStats, useGetRecentBugs } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Bug, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SeverityBadge, StatusBadge, CategoryBadge } from "@/components/bug-badges";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetBugStats();
  const { data: recentBugs, isLoading: isRecentLoading } = useGetRecentBugs({ limit: 5 });

  const rewardEligible = stats?.rewardEligible || 0;
  const progressPercent = Math.min(100, (rewardEligible / 10) * 100);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your bug hunting progress.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Reward Progress Card */}
        <Card className="col-span-1 md:col-span-2 bg-slate-900 border-slate-800 text-white dark:bg-slate-900 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Challenge Progress
            </CardTitle>
            <CardDescription className="text-slate-400">
              Submit 10 qualifying bugs to earn the free gift reward.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-14 w-full bg-slate-800" />
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <span className="text-4xl font-bold tracking-tighter">{rewardEligible}</span>
                    <span className="text-lg text-slate-400 font-medium"> / 10</span>
                  </div>
                  {rewardEligible >= 10 && (
                    <div className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Goal Reached
                    </div>
                  )}
                </div>
                <Progress 
                  value={progressPercent} 
                  className={`h-3 bg-slate-800 ${rewardEligible >= 10 ? "[&>div]:bg-green-500" : "[&>div]:bg-primary"}`}
                  data-testid="dashboard-reward-progress" 
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bugs</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold" data-testid="stat-total-bugs">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical & High</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold" data-testid="stat-critical-high">
                {(stats?.bySeverity.find(s => s.severity === "Critical")?.count || 0) + 
                 (stats?.bySeverity.find(s => s.severity === "High")?.count || 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Bugs */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your latest bug submissions</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/bugs" data-testid="link-view-all">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isRecentLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : !recentBugs?.length ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                No bugs reported yet.
                <div className="mt-4">
                  <Button asChild>
                    <Link href="/bugs/new">Report First Bug</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBugs.map((bug) => (
                  <Link 
                    key={bug.id} 
                    href={`/bugs/${bug.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors group cursor-pointer"
                    data-testid={`recent-bug-${bug.id}`}
                  >
                    <div className="space-y-2 mb-3 sm:mb-0">
                      <div className="font-medium group-hover:underline line-clamp-1">{bug.title}</div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(bug.createdAt), "MMM d, yyyy")}</span>
                        <span className="hidden sm:inline">•</span>
                        <CategoryBadge category={bug.category} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={bug.severity} />
                      <StatusBadge status={bug.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Severity Breakdown */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>By Severity</CardTitle>
            <CardDescription>Distribution of reported issues</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !stats?.bySeverity.length ? (
              <div className="text-center py-8 text-muted-foreground">No data available</div>
            ) : (
              <div className="space-y-4">
                {stats.bySeverity.map((item) => (
                  <div key={item.severity} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        item.severity === 'Critical' ? 'bg-red-500' :
                        item.severity === 'High' ? 'bg-orange-500' :
                        item.severity === 'Medium' ? 'bg-amber-500' :
                        item.severity === 'Low' ? 'bg-blue-500' : 'bg-slate-500'
                      }`} />
                      <span className="font-medium text-sm">{item.severity}</span>
                    </div>
                    <span className="text-muted-foreground text-sm font-mono">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
