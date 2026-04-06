import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";
import NotFound from "@/pages/not-found";

// Pages placeholder
const Dashboard = React.lazy(() => import("@/pages/dashboard"));
const BugList = React.lazy(() => import("@/pages/bug-list"));
const BugNew = React.lazy(() => import("@/pages/bug-new"));
const BugDetail = React.lazy(() => import("@/pages/bug-detail"));
const BugEdit = React.lazy(() => import("@/pages/bug-edit"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <React.Suspense fallback={<div className="flex items-center justify-center h-full w-full">Loading...</div>}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/bugs" component={BugList} />
          <Route path="/bugs/new" component={BugNew} />
          <Route path="/bugs/:id" component={BugDetail} />
          <Route path="/bugs/:id/edit" component={BugEdit} />
          <Route component={NotFound} />
        </Switch>
      </React.Suspense>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
