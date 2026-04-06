import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Bug, PlusCircle, Target } from "lucide-react";
import { useGetBugStats } from "@workspace/api-client-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: stats } = useGetBugStats();

  const rewardEligible = stats?.rewardEligible || 0;
  const progressPercent = Math.min(100, (rewardEligible / 10) * 100);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar variant="inset" className="border-r border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border py-4 px-6">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              <div className="font-semibold text-lg text-sidebar-foreground">Maya BugHunt</div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent className="pt-4">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/"} tooltip="Dashboard">
                      <Link href="/" data-testid="nav-dashboard">
                        <LayoutDashboard />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/bugs"} tooltip="All Bugs">
                      <Link href="/bugs" data-testid="nav-bugs">
                        <Bug />
                        <span>All Bugs</span>
                        {stats && (
                          <span className="ml-auto bg-sidebar-accent text-sidebar-accent-foreground py-0.5 px-2 rounded-full text-xs font-medium">
                            {stats.total}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/bugs/new"} tooltip="Report Bug">
                      <Link href="/bugs/new" data-testid="nav-new-bug">
                        <PlusCircle />
                        <span>Report Bug</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-sidebar-foreground font-medium">Reward Progress</span>
                <span className="text-sidebar-foreground/70 font-mono">{rewardEligible}/10</span>
              </div>
              <Progress value={progressPercent} className="h-2" data-testid="reward-progress" />
              <p className="text-xs text-sidebar-foreground/60 leading-tight">
                Submit 10 qualifying bugs (Critical/High/Medium) for the free gift.
              </p>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
