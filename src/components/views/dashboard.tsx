"use client";

import { useLang } from "@/lib/lang-store";
import { useMe, useTasks, useMembers, useNotifications, computeProgress, daysBetween, formatRelative } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2, Clock, AlertTriangle, CalendarClock, Users, TrendingUp,
  Plus, Lightbulb, ListChecks, UserPlus, GraduationCap, Bot, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewKey } from "@/components/app-shell";

interface DashboardProps {
  activeProjectId: string | null;
  setView: (v: ViewKey) => void;
  setActiveProjectId: (id: string | null) => void;
}

export function DashboardView({ activeProjectId, setView }: DashboardProps) {
  const { t, lang } = useLang();
  const { data: meData } = useMe();
  const user = meData?.user;
  const projects = meData?.projects || [];
  const activeProject = projects.find((p: any) => p.id === activeProjectId) || projects[0];

  const { data: tasksData } = useTasks(activeProject?.id);
  const { data: membersData } = useMembers(activeProject?.id);
  const { data: notifData } = useNotifications(activeProject?.id);

  const tasks = tasksData?.tasks || [];
  const members = membersData?.members || [];
  const notifications = notifData?.notifications || [];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t: any) => t.status === "todo").length;
  const overdueTasks = tasks.filter((t: any) => t.status === "overdue").length;
  const progress = computeProgress(tasks);
  const remainingDays = activeProject?.endDate ? Math.max(0, daysBetween(new Date(), activeProject.endDate)) : 0;

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="container mx-auto px-4 lg:px-6 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-6 py-16">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-gold/10">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t.dashboard.welcome}, {user?.name}</h2>
            <p className="text-muted-foreground">{t.dashboard.noProjectTitle}</p>
            <p className="text-sm text-muted-foreground">{t.dashboard.noProjectDesc}</p>
          </div>
          <Button size="lg" onClick={() => setView("createProject")} className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" />
            {t.dashboard.createProject}
          </Button>
        </div>
      </div>
    );
  }

  const upcomingTasks = tasks
    .filter((t: any) => t.status !== "completed")
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const stats = [
    { label: t.dashboard.stats.progress, value: `${progress}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: t.dashboard.stats.totalTasks, value: totalTasks, icon: ListChecks, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t.dashboard.stats.completedTasks, value: completedTasks, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: t.dashboard.stats.pendingTasks, value: pendingTasks, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: t.dashboard.stats.overdueTasks, value: overdueTasks, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: t.dashboard.stats.remainingDays, value: remainingDays, icon: CalendarClock, color: "text-purple-600", bg: "bg-purple-50" },
    { label: t.dashboard.stats.teamMembers, value: members.length, icon: Users, color: "text-gold", bg: "bg-gold/10" },
  ];

  const quickActions = [
    { label: t.dashboard.actions.createProject, icon: Plus, view: "createProject" as ViewKey },
    { label: t.dashboard.actions.analyzeIdea, icon: Lightbulb, view: "ideaAnalyzer" as ViewKey },
    { label: t.dashboard.actions.addTask, icon: ListChecks, view: "smartTasks" as ViewKey },
    { label: t.dashboard.actions.inviteMember, icon: UserPlus, view: "teamManagement" as ViewKey },
    { label: t.dashboard.actions.defenseSimulation, icon: GraduationCap, view: "defenseSimulator" as ViewKey },
  ];

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{t.dashboard.welcomeBack}, {user?.name} 👋</h2>
          <p className="text-sm text-muted-foreground">
            {t.dashboard.activeProject}: <span className="text-primary font-medium">{activeProject?.name}</span>
          </p>
        </div>
        <Button onClick={() => setView("createProject")} className="bg-primary hover:bg-primary/90 gap-2 self-start">
          <Plus className="h-4 w-4" />
          {t.dashboard.createProject}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", s.bg)}>
                  <Icon className={cn("h-4 w-4", s.color)} />
                </div>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Project summary + progress + tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project summary */}
          <Card className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{activeProject?.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{activeProject?.description}</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">{t.status[activeProject?.status as keyof typeof t.status] || activeProject?.status}</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t.dashboard.startDate}:</span>
                <span className="font-medium">{activeProject?.startDate ? new Date(activeProject.startDate).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t.dashboard.endDate}:</span>
                <span className="font-medium">{activeProject?.endDate ? new Date(activeProject.endDate).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t.dashboard.currentPhase}:</span>
                <span className="font-medium">{activeProject?.currentPhase || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t.dashboard.teamMembers}:</span>
                <div className="flex -space-x-2">
                  {members.slice(0, 4).map((m: any) => (
                    <Avatar key={m.id} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{m.user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {members.length > 4 && (
                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px]">+{members.length - 4}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium">{t.dashboard.progressSection}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>
          </Card>

          {/* Upcoming tasks */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{t.dashboard.upcomingTasks}</h3>
              <Button variant="ghost" size="sm" onClick={() => setView("smartTasks")}>
                {t.common.seeAll}
                <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
              </Button>
            </div>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t.dashboard.noUpcomingTasks}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-start font-medium pb-2">{t.dashboard.taskCols.title}</th>
                      <th className="text-start font-medium pb-2">{t.dashboard.taskCols.assignee}</th>
                      <th className="text-start font-medium pb-2 hidden sm:table-cell">{t.dashboard.taskCols.due}</th>
                      <th className="text-start font-medium pb-2 hidden sm:table-cell">{t.dashboard.taskCols.priority}</th>
                      <th className="text-start font-medium pb-2">{t.dashboard.taskCols.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingTasks.map((task: any) => (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => setView("smartTasks")}>
                        <td className="py-2.5 font-medium truncate max-w-[180px]">{task.title}</td>
                        <td className="py-2.5 text-muted-foreground">{members.find((m: any) => m.userId === task.assigneeId)?.user?.name || "—"}</td>
                        <td className="py-2.5 text-muted-foreground hidden sm:table-cell">{task.dueDate ? new Date(task.dueDate).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}</td>
                        <td className="py-2.5 hidden sm:table-cell">
                          <PriorityBadge priority={task.priority} t={t} />
                        </td>
                        <td className="py-2.5">
                          <StatusBadge status={task.status} t={t} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Recent activity */}
          <Card className="p-5">
            <h3 className="font-bold mb-3">{t.dashboard.recentActivity}</h3>
            {activeProject?.activities?.length ? (
              <div className="space-y-2">
                {activeProject.activities.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-gold mt-1.5 shrink-0" />
                    <div>
                      <span className="text-foreground">{a.details}</span>
                      <span className="text-xs text-muted-foreground block mt-0.5">{formatRelative(a.createdAt, lang)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t.dashboard.noActivity}</p>
            )}
          </Card>
        </div>

        {/* Right: AI recommendations + quick actions */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="p-5">
            <h3 className="font-bold mb-3">{t.dashboard.quickActions}</h3>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <Button key={i} variant="outline" className="justify-start gap-2.5 h-auto py-2.5" onClick={() => setView(a.view)}>
                    <Icon className="h-4 w-4 text-gold" />
                    <span className="text-sm">{a.label}</span>
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* AI recommendations */}
          <Card className="p-5 bg-gradient-to-br from-primary/5 to-gold/5 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-bold text-primary">{t.dashboard.aiRecommendations}</h3>
            </div>
            <div className="space-y-2.5">
              {generateRecommendations(t, tasks, members, remainingDays).map((rec, i) => (
                <div key={i} className="rounded-lg bg-card border border-primary/10 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                    <p className="text-muted-foreground">{rec}</p>
                  </div>
                </div>
              ))}
              {generateRecommendations(t, tasks, members, remainingDays).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">{t.dashboard.noRecommendations}</p>
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3 border-primary/30 text-primary hover:bg-primary/5" onClick={() => setView("aiAssistant")}>
              <Bot className="h-3.5 w-3.5" />
              {t.assistant.title}
            </Button>
          </Card>

          {/* Recent notifications */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{t.notifications.title}</h3>
              <Button variant="ghost" size="sm" onClick={() => setView("notifications")}>{t.common.seeAll}</Button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t.notifications.empty}</p>
            ) : (
              <ScrollArea className="max-h-72 custom-scroll">
                <div className="space-y-2">
                  {notifications.slice(0, 4).map((n: any) => (
                    <div key={n.id} className={cn("rounded-lg border p-2.5 text-sm", !n.read && "bg-gold/5 border-gold/20")}>
                      <div className="font-medium text-sm">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{formatRelative(n.createdAt, lang)}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function generateRecommendations(t: any, tasks: any[], members: any[], remainingDays: number): string[] {
  const recs: string[] = [];
  const overdue = tasks.filter((t) => t.status === "overdue");
  if (overdue.length > 0) {
    recs.push(`لديك ${overdue.length} مهمة متأخرة. يُنصح بإعادة توزيعها أو تعديل الجدول الزمني.`);
  }
  const workloads = members.map((m) => ({ name: m.user?.name, count: tasks.filter((t) => t.assigneeId === m.userId && t.status !== "completed").length }));
  const overloaded = workloads.filter((w) => w.count >= 3);
  if (overloaded.length > 0) {
    recs.push(`عبء العمل مرتفع على ${overloaded.map((w) => w.name).join("، ")}. فكّر في إعادة توزيع بعض المهام.`);
  }
  const upcoming = tasks.filter((t) => {
    if (!t.dueDate || t.status === "completed") return false;
    const days = Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  });
  if (upcoming.length > 0) {
    recs.push(`${upcoming.length} مهام تستحق خلال 7 أيام. راجع الأولويات.`);
  }
  if (remainingDays > 0 && remainingDays < 14) {
    recs.push(`تبقّى ${remainingDays} يوماً على تسليم المشروع. ركّز على المعلم النهائي.`);
  }
  if (recs.length === 0) {
    recs.push("المشروع يسير على ما يرام. استمر في متابعة التقدم والمهام القادمة.");
  }
  return recs;
}

export function PriorityBadge({ priority, t }: { priority: string; t: any }) {
  const map: Record<string, { label: string; cls: string }> = {
    low: { label: t.tasks.priority.low, cls: "bg-slate-100 text-slate-700" },
    medium: { label: t.tasks.priority.medium, cls: "bg-blue-100 text-blue-700" },
    high: { label: t.tasks.priority.high, cls: "bg-amber-100 text-amber-700" },
    urgent: { label: t.tasks.priority.urgent, cls: "bg-red-100 text-red-700" },
  };
  const v = map[priority] || map.medium;
  return <Badge variant="outline" className={v.cls + " border-0"}>{v.label}</Badge>;
}

export function StatusBadge({ status, t }: { status: string; t: any }) {
  const map: Record<string, { label: string; cls: string }> = {
    todo: { label: t.status.todo, cls: "bg-slate-100 text-slate-700" },
    in_progress: { label: t.status.in_progress_task, cls: "bg-blue-100 text-blue-700" },
    completed: { label: t.status.completed_task, cls: "bg-emerald-100 text-emerald-700" },
    overdue: { label: t.status.overdue, cls: "bg-red-100 text-red-700" },
  };
  const v = map[status] || map.todo;
  return <Badge variant="outline" className={v.cls + " border-0"}>{v.label}</Badge>;
}
