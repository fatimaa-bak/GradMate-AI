"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-store";
import { useMe, useTasks, useMembers, useTimeline, useUpdateProject, computeProgress, daysBetween } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Lightbulb, Users, ListChecks, CalendarRange, Bot, GraduationCap,
  Pencil, Save, X, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { ViewKey } from "@/components/app-shell";
import { StatusBadge } from "@/components/views/dashboard";

interface Props {
  activeProjectId: string | null;
  setView: (v: ViewKey) => void;
}

export function ProjectOverviewView({ activeProjectId, setView }: Props) {
  const { t, lang } = useLang();
  const { data: meData } = useMe();
  const activeProject = meData?.projects?.find((p: any) => p.id === activeProjectId);
  const { data: tasksData } = useTasks(activeProjectId);
  const { data: membersData } = useMembers(activeProjectId);
  const { data: timelineData } = useTimeline(activeProjectId);
  const updateProject = useUpdateProject();

  const tasks = tasksData?.tasks || [];
  const members = membersData?.members || [];
  const phases = timelineData?.phases || [];

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: activeProject?.name || "",
    description: activeProject?.description || "",
    objectives: activeProject?.objectives || "",
    problemStatement: activeProject?.problemStatement || "",
    technologies: activeProject?.technologies || "",
    category: activeProject?.category || "",
    currentPhase: activeProject?.currentPhase || "",
  });

  if (!activeProject) {
    return <div className="p-6 text-center text-muted-foreground">{t.dashboard.noProjectTitle}</div>;
  }

  const completed = tasks.filter((t: any) => t.status === "completed").length;
  const pending = tasks.filter((t: any) => t.status === "todo").length;
  const overdue = tasks.filter((t: any) => t.status === "overdue").length;
  const progress = computeProgress(tasks);
  const currentWeek = activeProject.startDate ? Math.ceil(daysBetween(new Date(activeProject.startDate), new Date()) / 7) : 0;
  const remaining = activeProject.endDate ? daysBetween(new Date(), activeProject.endDate) : 0;

  async function saveEdit() {
    try {
      await updateProject.mutateAsync({ id: activeProject?.id, ...form });
      toast.success(t.settings.profile.saved);
      setEditing(false);
    } catch (e: any) { toast.error(e.message); }
  }

  const quickNav: { icon: any; label: string; view: ViewKey; color: string }[] = [
    { icon: Lightbulb, label: t.dashboard.actions.analyzeIdea, view: "ideaAnalyzer", color: "text-amber-600 bg-amber-50" },
    { icon: Users, label: t.sidebar.teamManagement, view: "teamManagement", color: "text-blue-600 bg-blue-50" },
    { icon: ListChecks, label: t.dashboard.actions.addTask, view: "smartTasks", color: "text-emerald-600 bg-emerald-50" },
    { icon: CalendarRange, label: t.sidebar.projectTimeline, view: "projectTimeline", color: "text-purple-600 bg-purple-50" },
    { icon: Bot, label: t.sidebar.aiAssistant, view: "aiAssistant", color: "text-primary bg-primary/10" },
    { icon: GraduationCap, label: t.dashboard.actions.defenseSimulation, view: "defenseSimulator", color: "text-gold bg-gold/10" },
  ];

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">{activeProject.name}</h2>
          <p className="text-sm text-muted-foreground">{activeProject.description}</p>
        </div>
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            {t.projectOverview.edit}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4" />{t.common.cancel}</Button>
            <Button onClick={saveEdit} disabled={updateProject.isPending} className="bg-primary">
              <Save className="h-4 w-4" />
              {t.projectOverview.save}
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Project info */}
        <Card className="p-5 lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{t.projectOverview.info}</h3>
            <Badge className="bg-primary/10 text-primary border-0">{t.status[activeProject.status as keyof typeof t.status]}</Badge>
          </div>
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t.createProject.basic.name}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t.createProject.basic.description}</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t.createProject.basic.objectives}</Label>
                  <Textarea rows={2} value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.createProject.basic.problem}</Label>
                  <Textarea rows={2} value={form.problemStatement} onChange={(e) => setForm({ ...form, problemStatement: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t.createProject.basic.category}</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.dashboard.currentPhase}</Label>
                  <Input value={form.currentPhase} onChange={(e) => setForm({ ...form, currentPhase: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t.createProject.team.technologies}</Label>
                <Textarea rows={2} value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <Row label={t.createProject.basic.objectives} value={activeProject.objectives} />
              <Row label={t.createProject.basic.problem} value={activeProject.problemStatement} />
              <Row label={t.createProject.basic.category} value={activeProject.category} />
              <Row label={t.createProject.basic.specialization} value={activeProject.specialization} />
              <Row label={t.createProject.basic.targetUsers} value={activeProject.targetUsers} />
              <Row label={t.createProject.team.technologies} value={activeProject.technologies} />
              <Row label={t.dashboard.currentPhase} value={activeProject.currentPhase} />
              <Row label={t.createProject.team.supervisor} value={activeProject.supervisorName} />
            </div>
          )}
        </Card>

        {/* Stats */}
        <Card className="p-5">
          <h3 className="font-bold mb-3">{t.projectOverview.stats}</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{t.dashboard.progressSection}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label={t.dashboard.stats.completedTasks} value={completed} color="text-emerald-600" icon={CheckCircle2} />
              <Stat label={t.dashboard.stats.pendingTasks} value={pending} color="text-blue-600" icon={Clock} />
              <Stat label={t.dashboard.stats.overdueTasks} value={overdue} color="text-red-600" icon={AlertTriangle} />
            </div>
          </div>
        </Card>

        {/* Timeline summary */}
        <Card className="p-5">
          <h3 className="font-bold mb-3">{t.projectOverview.timeline}</h3>
          <div className="space-y-2 text-sm">
            <Row label={t.dashboard.startDate} value={activeProject.startDate ? new Date(activeProject.startDate).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"} />
            <Row label={t.dashboard.endDate} value={activeProject.endDate ? new Date(activeProject.endDate).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"} />
            <Row label={t.projectOverview.currentWeek} value={`${currentWeek} / ${activeProject.durationWeeks}`} />
            <Row label={t.projectOverview.remaining} value={`${remaining} ${t.common.days}`} />
          </div>
          {phases.length > 0 && (
            <div className="mt-3 pt-3 border-t space-y-1.5">
              {phases.slice(0, 3).map((p: any) => (
                <div key={p.id} className="text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium">{p.title}</span>
                    <span className="text-muted-foreground">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="h-1 mt-1" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Team */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">{t.projectOverview.team}</h3>
            <Button variant="ghost" size="sm" onClick={() => setView("teamManagement")}>{t.common.seeAll}</Button>
          </div>
          <div className="space-y-2">
            {members.map((m: any) => (
              <div key={m.id} className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 border border-gold/30">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">{m.user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.user?.name}</div>
                  <div className="text-xs text-muted-foreground">{m.role === "owner" ? t.team.teamLeader : t.sidebar.teamManagement}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{m.completedTasks}/{m.assignedTasks || 0} {t.common.tasks}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick nav */}
        <Card className="p-5">
          <h3 className="font-bold mb-3">{t.projectOverview.quickNav}</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickNav.map((n, i) => {
              const Icon = n.icon;
              return (
                <Button key={i} variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={() => setView(n.view)}>
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${n.color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs">{n.label}</span>
                </Button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b last:border-0 pb-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="col-span-2 text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function Stat({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className="rounded-lg border p-2">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
