import React, { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  useListBugs, 
  BugCategory, 
  BugSeverity, 
  BugStatus 
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge, SeverityBadge, StatusBadge } from "@/components/bug-badges";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, PlusCircle, FilterX } from "lucide-react";

export default function BugList() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const queryParams = {
    ...(search ? { search } : {}),
    ...(category !== "all" ? { category } : {}),
    ...(severity !== "all" ? { severity } : {}),
    ...(status !== "all" ? { status } : {}),
  };

  const { data: bugs, isLoading } = useListBugs(queryParams);

  const handleResetFilters = () => {
    setSearch("");
    setCategory("all");
    setSeverity("all");
    setStatus("all");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Bug Reports</h1>
          <p className="text-muted-foreground">Manage and track all identified issues.</p>
        </div>
        <Button asChild>
          <Link href="/bugs/new" data-testid="btn-new-bug">
            <PlusCircle className="mr-2 h-4 w-4" />
            Report Bug
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bugs..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="filter-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.values(BugCategory).map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger data-testid="filter-severity">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {Object.values(BugSeverity).map((sev) => (
                  <SelectItem key={sev} value={sev}>{sev}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="flex-1" data-testid="filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(BugStatus).map((stat) => (
                    <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleResetFilters}
                title="Reset filters"
                data-testid="btn-reset-filters"
                className="shrink-0"
              >
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 items-start md:items-end">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : bugs?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-muted p-4 rounded-full mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No bugs found</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                We couldn't find any bug reports matching your current filters.
              </p>
              <Button onClick={handleResetFilters}>Clear Filters</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bugs?.map((bug) => (
              <Card key={bug.id} className="hover:border-primary/50 transition-colors group">
                <Link href={`/bugs/${bug.id}`} className="block h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xl font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2" data-testid={`bug-title-${bug.id}`}>
                            {bug.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CategoryBadge category={bug.category} />
                          <SeverityBadge severity={bug.severity} />
                          <StatusBadge status={bug.status} />
                          {bug.submittedToForm && (
                            <span className="text-xs text-muted-foreground font-medium ml-1 flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 inline-block"></span>
                              In Google Form
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-2 text-sm text-muted-foreground shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 mt-2 lg:mt-0">
                        <div className="font-mono bg-muted px-2 py-1 rounded text-xs" data-testid={`bug-id-${bug.id}`}>
                          BUG-{bug.id.toString().padStart(4, '0')}
                        </div>
                        <div data-testid={`bug-date-${bug.id}`}>
                          {format(new Date(bug.createdAt), "MMM d, yyyy h:mm a")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
