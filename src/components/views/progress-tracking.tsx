"use client";

import { useLang } from "@/lib/lang-store";
import { useTasks, useMembers, useTimeline, computeProgress } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle, CalendarClock, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  activeProjectId: string | null;
}

export function ProgressTrackingView({ activeProjectId }: Props) {
  const { t, lang } = useLang();
  const { data: tasksData } = useTasks(activeProjectId);
  const { data: membersData } = useMembers(activeProjectId);
  const { data: timelineData } = useTimeline(activeProjectId);

  const tasks = tasksData?.tasks || [];
  const members = membersData?.members || [];
  const phases = timelineData?.phases || [];

  const completed = tasks.filter((t: any) => t.status === "completed").length;
  const pending = tasks.filter((t: any) => t.status === "todo").length;
  const inProgress = tasks.filter((t: any) => t.status === "in_progress").length;
  const overdue = tasks.filter((t: any) => t.status === "overdue").length;
  const progress = computeProgress(tasks);

  // Status distribution
  const statusData = [
    { name: t.status.completed_task, value: completed, color: "#10b981" },
    { name: t.status.in_progress_task, value: inProgress, color: "#3b82f6" },
    { name: t.status.todo, value: pending, color: "#94a3b8" },
    { name: t.status.overdue, value: overdue, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Weekly progress (synthesized from tasks due dates)
  const weeklyData = Array.from({ length: 8 }).map((_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (7 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekTasks = tasks.filter((t: any) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= weekStart && d < weekEnd;
    });
    const completedInWeek = weekTasks.filter((t: any) => t.status === "completed").length;
    return {
      week: `${lang === "ar" ? "أ" : "W"}${i + 1}`,
      planned: weekTasks.length,
      actual: completedInWeek,
    };
  });

  // Team workload
  const workloadData = members.map((m: any) => ({
    name: m.user?.name?.split(" ")[0] || "—",
    assigned: m.assignedTasks || 0,
    completed: m.completedTasks || 0,
    workload: m.workload || 0,
  }));

  // Planned vs actual progress per phase
  const phaseProgress = phases.map((p: any) => ({
    name: p.title.slice(0, 15),
    planned: 100,
    actual: p.progress || 0,
  }));

  // Task completion radial
  const completionData = [{ name: "progress", value: progress, fill: "#781206" }];

  const stats = [
    { label: t.progress.stats.completion, value: `${progress}%`, icon: Target, color: "text-primary" },
    { label: t.progress.stats.completed, value: completed, icon: CheckCircle2, color: "text-emerald-600" },
    { label: t.progress.stats.pending, value: pending, icon: Clock, color: "text-blue-600" },
    { label: t.progress.stats.overdue, value: overdue, icon: AlertTriangle, color: "text-red-600" },
    { label: t.progress.stats.milestones, value: phases.filter((p: any) => p.isMilestone).length, icon: CalendarClock, color: "text-purple-600" },
    { label: t.progress.stats.remaining, value: tasks.length ? `${Math.max(0, 100 - progress)}%` : "—", icon: TrendingUp, color: "text-gold" },
  ];

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" />{t.progress.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{tasks.length} {t.common.tasks}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="p-3">
              <Icon className={cn("h-4 w-4 mb-2", s.color)} />
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Completion radial */}
        <Card className="p-5">
          <h3 className="font-bold text-sm mb-3">{t.progress.charts.taskCompletion}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="60%" outerRadius="100%" data={completionData} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="value" cornerRadius={10} fill="var(--primary)" />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                  {progress}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status distribution */}
        <Card className="p-5">
          <h3 className="font-bold text-sm mb-3">{t.progress.charts.status}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={(entry: any) => `${entry.value}`}>
                  {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Weekly progress */}
        <Card className="p-5 lg:col-span-1">
          <h3 className="font-bold text-sm mb-3">{t.progress.charts.weeklyProgress}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="cActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#781206" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#781206" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="actual" stroke="#781206" fill="url(#cActual)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Workload */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-sm mb-3">{t.progress.charts.workload}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="assigned" name={t.progress.assigned} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name={t.progress.completed} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Planned vs actual */}
        <Card className="p-5">
          <h3 className="font-bold text-sm mb-3">{t.progress.charts.plannedVsActual}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={phaseProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="planned" stroke="#94a3b8" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="actual" stroke="#781206" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Team performance */}
      <Card className="p-5">
        <h3 className="font-bold mb-3">{t.progress.teamPerformance}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-start font-medium pb-2">{t.progress.member}</th>
                <th className="text-start font-medium pb-2">{t.progress.assigned}</th>
                <th className="text-start font-medium pb-2">{t.progress.completed}</th>
                <th className="text-start font-medium pb-2">{t.progress.rate}</th>
                <th className="text-start font-medium pb-2 min-w-[140px]">{t.team.member.workload}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => {
                const rate = m.assignedTasks ? Math.round((m.completedTasks / m.assignedTasks) * 100) : 0;
                return (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{m.user?.name?.charAt(0)}</AvatarFallback></Avatar>
                        <span className="font-medium">{m.user?.name}</span>
                      </div>
                    </td>
                    <td className="py-3">{m.assignedTasks || 0}</td>
                    <td className="py-3 text-emerald-600 font-medium">{m.completedTasks || 0}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={rate >= 75 ? "bg-emerald-100 text-emerald-700 border-0" : rate >= 40 ? "bg-amber-100 text-amber-700 border-0" : "bg-slate-100 text-slate-700 border-0"}>{rate}%</Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={m.workload || 0} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{m.workload || 0}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
