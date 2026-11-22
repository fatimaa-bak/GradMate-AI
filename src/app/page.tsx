"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useLang, applyDir } from "@/lib/lang-store";
import { AppShell, type ViewKey } from "@/components/app-shell";
import { LandingView } from "@/components/views/landing";
import { AuthView } from "@/components/views/auth";
import { DashboardView } from "@/components/views/dashboard";
import { CreateProjectView } from "@/components/views/create-project";
import { MyProjectsView } from "@/components/views/my-projects";
import { ProjectOverviewView } from "@/components/views/project-overview";
import { IdeaAnalyzerView } from "@/components/views/idea-analyzer";
import { TeamManagementView } from "@/components/views/team-management";
import { SmartTasksView } from "@/components/views/smart-tasks";
import { ProjectTimelineView } from "@/components/views/project-timeline";
import { AiAssistantView } from "@/components/views/ai-assistant";
import { AgentPipelineView } from "@/components/views/agent-pipeline";
import { ProgressTrackingView } from "@/components/views/progress-tracking";
import { FilesView } from "@/components/views/files";
import { DefenseSimulatorView } from "@/components/views/defense-simulator";
import { NotificationsView } from "@/components/views/notifications";
import { SettingsView } from "@/components/views/settings";

type Page = "landing" | "auth";

export default function Home() {
  const { data: session, status } = useSession();
  const { dir, lang } = useLang();

  // Apply dir on lang change
  useEffect(() => {
    applyDir(dir);
  }, [dir, lang]);

  const [page, setPage] = useState<Page>("landing");
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  const [view, setView] = useState<ViewKey>("dashboard");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // If authed, show app; else show landing/auth
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <div className="h-12 w-12 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">GradMate AI</p>
        </div>
      </div>
    );
  }

  if (!session) {
    if (page === "auth") {
      return (
        <AuthView
          mode={authMode}
          onSwitchMode={setAuthMode}
          onBackToLanding={() => setPage("landing")}
        />
      );
    }
    return (
      <LandingView
        onLogin={() => { setAuthMode("login"); setPage("auth"); }}
        onRegister={() => { setAuthMode("register"); setPage("auth"); }}
        isAuthed={false}
        onOpenDashboard={() => {}}
      />
    );
  }

  // Authenticated app
  return (
    <AppShell
      view={view}
      setView={setView}
      activeProjectId={activeProjectId}
      setActiveProjectId={setActiveProjectId}
      onLogout={() => signOut({ callbackUrl: "/" })}
    >
      {view === "dashboard" && (
        <DashboardView activeProjectId={activeProjectId} setView={setView} setActiveProjectId={setActiveProjectId} />
      )}
      {view === "createProject" && (
        <CreateProjectView setView={setView} setActiveProjectId={setActiveProjectId} />
      )}
      {view === "myProjects" && (
        <MyProjectsView setView={setView} setActiveProjectId={setActiveProjectId} />
      )}
      {view === "projectOverview" && (
        <ProjectOverviewView activeProjectId={activeProjectId} setView={setView} />
      )}
      {view === "ideaAnalyzer" && (
        <IdeaAnalyzerView activeProjectId={activeProjectId} />
      )}
      {view === "teamManagement" && (
        <TeamManagementView activeProjectId={activeProjectId} />
      )}
      {view === "smartTasks" && (
        <SmartTasksView activeProjectId={activeProjectId} />
      )}
      {view === "projectTimeline" && (
        <ProjectTimelineView activeProjectId={activeProjectId} />
      )}
      {view === "aiAssistant" && (
        <AiAssistantView activeProjectId={activeProjectId} />
      )}
      {view === "agentPipeline" && (
        <AgentPipelineView activeProjectId={activeProjectId} setView={setView} />
      )}
      {view === "progressTracking" && (
        <ProgressTrackingView activeProjectId={activeProjectId} />
      )}
      {view === "files" && (
        <FilesView activeProjectId={activeProjectId} />
      )}
      {view === "defenseSimulator" && (
        <DefenseSimulatorView activeProjectId={activeProjectId} />
      )}
      {view === "notifications" && (
        <NotificationsView activeProjectId={activeProjectId} />
      )}
      {view === "settings" && <SettingsView />}
    </AppShell>
  );
}
