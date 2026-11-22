"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/lib/lang-store";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard, FolderKanban, Lightbulb, Users, ListChecks, CalendarRange,
  Bot, TrendingUp, FolderOpen, GraduationCap, Bell, Settings, LogOut,
  Search, Menu, Moon, Sun, Languages, ChevronDown, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useMe, useNotifications } from "@/lib/hooks";

export type ViewKey =
  | "dashboard" | "myProjects" | "createProject" | "projectOverview"
  | "ideaAnalyzer" | "teamManagement" | "smartTasks" | "projectTimeline"
  | "aiAssistant" | "progressTracking" | "files" | "defenseSimulator"
  | "agentPipeline" | "notifications" | "settings";

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  status: string;
  currentPhase?: string;
  startDate?: string;
  endDate?: string;
  durationWeeks?: number;
  members?: any[];
  tasks?: any[];
}

interface AppShellProps {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppShell({ view, setView, activeProjectId, setActiveProjectId, onLogout, children }: AppShellProps) {
  const { t, lang, toggle: toggleLang } = useLang();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: meData } = useMe();
  const { data: notifData } = useNotifications();
  const user = meData?.user;
  const projects = meData?.projects || [];
  const activeProject = projects.find((p: any) => p.id === activeProjectId) || projects[0];
  const unreadCount = (notifData?.notifications || []).filter((n: any) => !n.read).length;

  // Sync activeProjectId if undefined
  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId, setActiveProjectId]);

  const navMain: { key: ViewKey; label: string; icon: any }[] = [
    { key: "dashboard", label: t.sidebar.dashboard, icon: LayoutDashboard },
    { key: "myProjects", label: t.sidebar.myProjects, icon: FolderKanban },
  ];
  const navTools: { key: ViewKey; label: string; icon: any }[] = [
    { key: "agentPipeline", label: t.sidebar.agentPipeline, icon: Bot },
    { key: "ideaAnalyzer", label: t.sidebar.ideaAnalyzer, icon: Lightbulb },
    { key: "teamManagement", label: t.sidebar.teamManagement, icon: Users },
    { key: "smartTasks", label: t.sidebar.smartTasks, icon: ListChecks },
    { key: "projectTimeline", label: t.sidebar.projectTimeline, icon: CalendarRange },
    { key: "aiAssistant", label: t.sidebar.aiAssistant, icon: Bot },
    { key: "progressTracking", label: t.sidebar.progressTracking, icon: TrendingUp },
    { key: "defenseSimulator", label: t.sidebar.defenseSimulator, icon: GraduationCap },
  ];
  const navManage: { key: ViewKey; label: string; icon: any }[] = [
    { key: "files", label: t.sidebar.files, icon: FolderOpen },
    { key: "notifications", label: t.sidebar.notifications, icon: Bell },
    { key: "settings", label: t.sidebar.settings, icon: Settings },
  ];

  const SidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <Logo size="sm" variant="light" />
      </div>
      <ScrollArea className="flex-1 px-3 py-4 custom-scroll">
        <nav className="space-y-6">
          <NavSection title={t.sidebar.mainNav} items={navMain} view={view} setView={(v) => { setView(v); setMobileOpen(false); }} />
          <NavSection title={t.sidebar.toolsNav} items={navTools} view={view} setView={(v) => { setView(v); setMobileOpen(false); }} />
          <NavSection title={t.sidebar.manageNav} items={navManage} view={view} setView={(v) => { setView(v); setMobileOpen(false); }} />
        </nav>
      </ScrollArea>
      <div className="p-3 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          {t.sidebar.logout}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-l-0">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72 p-0 border-0">
          <SheetTitle className="sr-only">{t.sidebar.mainNav}</SheetTitle>
          {SidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center gap-3 border-b bg-card px-4 lg:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Page title */}
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight">
              {getTitleForView(view, t)}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{t.tagline}</p>
          </div>

          {/* Project selector */}
          {projects.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden md:flex gap-2 ml-2 max-w-[260px]">
                  <FolderKanban className="h-4 w-4 text-gold" />
                  <span className="truncate">{activeProject?.name || t.topbar.noActiveProject}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>{t.topbar.selectProject}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {projects.map((p: any) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => setActiveProjectId(p.id)}
                    className={cn(p.id === activeProjectId && "bg-accent")}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{p.currentPhase || p.status}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setView("createProject")}>
                  <Plus className="h-4 w-4 mr-2 text-gold" />
                  {t.createProject.title}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="flex-1" />

          {/* Search (decorative) */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              placeholder={t.topbar.search}
              className="h-9 w-48 rounded-md border border-input bg-background pl-3 pr-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Language */}
          <Button variant="ghost" size="icon" onClick={toggleLang} title={t.topbar.language}>
            <Languages className="h-4 w-4" />
            <span className="sr-only">{t.topbar.language}</span>
          </Button>

          {/* Theme */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={t.topbar.theme}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" onClick={() => setView("notifications")}>
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-8 w-8 border-2 border-gold">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.name}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setView("settings")}>
                <Settings className="h-4 w-4 mr-2" />
                {t.topbar.settings}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                {t.topbar.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background custom-scroll view-enter" key={view}>
          {children}
        </main>
      </div>
    </div>
  );
}

function NavSection({ title, items, view, setView }: { title: string; items: { key: ViewKey; label: string; icon: any }[]; view: ViewKey; setView: (v: ViewKey) => void }) {
  return (
    <div>
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "sidebar-active font-semibold text-gold"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getTitleForView(view: ViewKey, t: any): string {
  const map: Record<ViewKey, string> = {
    dashboard: t.sidebar.dashboard,
    myProjects: t.sidebar.myProjects,
    createProject: t.createProject.title,
    projectOverview: t.projectOverview.title,
    ideaAnalyzer: t.ideaAnalyzer.title,
    teamManagement: t.team.title,
    smartTasks: t.tasks.title,
    projectTimeline: t.timeline.title,
    aiAssistant: t.assistant.title,
    progressTracking: t.progress.title,
    files: t.files.title,
    defenseSimulator: t.defense.title,
    agentPipeline: t.agentPipeline.title,
    notifications: t.notifications.title,
    settings: t.settings.title,
  };
  return map[view] || "";
}
