"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-store";
import { useTimeline, useAiPlanner, useUpdatePhase } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalendarRange, Loader2, Sparkles, ZoomIn, ZoomOut, Flag, Save,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  activeProjectId: string | null;
}

export function ProjectTimelineView({ activeProjectId }: Props) {
  const { t, lang } = useLang();
  const { data: tlData } = useTimeline(activeProjectId);
  const planner = useAiPlanner();
  const updatePhase = useUpdatePhase();
  const phases = tlData?.phases || [];

  const [view, setView] = useState<"weekly" | "monthly">("weekly");
  const [zoom, setZoom] = useState(1);
  const [filterMember, setFilterMember] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  async function generatePlan() {
    try {
      const res = await planner.mutateAsync({ projectId: activeProjectId, apply: true });
      toast.success(t.common.success);
    } catch (e: any) { toast.error(e.message); }
  }

  // Calculate timeline bounds
  const allDates = phases.flatMap((p: any) => [new Date(p.startDate).getTime(), new Date(p.endDate).getTime()]);
  const minDate = allDates.length ? Math.min(...allDates) : Date.now();
  const maxDate = allDates.length ? Math.max(...allDates) : Date.now() + 12 * 7 * 86400000;
  const totalSpan = Math.max(1, maxDate - minDate);

  function posFor(date: string | Date) {
    const t = new Date(date).getTime();
    return ((t - minDate) / totalSpan) * 100;
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><CalendarRange className="h-6 w-6 text-primary" />{t.timeline.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{phases.length} {t.timeline.phase}</p>
        </div>
        <Button onClick={generatePlan} disabled={planner.isPending} className="bg-primary gap-2">
          {planner.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-gold" />}
          {planner.isPending ? t.timeline.planning : t.timeline.aiPlan}
        </Button>
      </div>

      {/* Controls */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            <Button variant={view === "weekly" ? "default" : "outline"} size="sm" onClick={() => setView("weekly")}>{t.timeline.weekly}</Button>
            <Button variant={view === "monthly" ? "default" : "outline"} size="sm" onClick={() => setView("monthly")}>{t.timeline.monthly}</Button>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><ZoomOut className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(2, z + 0.25))}><ZoomIn className="h-3.5 w-3.5" /></Button>
          </div>
          <Select value={filterMember} onValueChange={setFilterMember}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.timeline.all}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.timeline.all}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => toast.success(t.common.success)}>
            <Save className="h-3.5 w-3.5" />{t.timeline.save}
          </Button>
        </div>
      </Card>

      {phases.length === 0 ? (
        <Card className="p-10 text-center">
          <CalendarRange className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">{t.timeline.noPhases}</p>
          <Button onClick={generatePlan} className="mt-4 bg-primary gap-2">
            <Sparkles className="h-4 w-4 text-gold" />{t.timeline.aiPlan}
          </Button>
        </Card>
      ) : (
        <>
          {/* Gantt */}
          <Card className="p-5">
            <div className="overflow-x-auto" style={{ minWidth: 600 * zoom }}>
              {/* Header timeline */}
              <div className="relative h-8 mb-2 border-b">
                <div className="absolute inset-0 flex">
                  {Array.from({ length: view === "weekly" ? 12 : 6 }).map((_, i) => (
                    <div key={i} className="flex-1 border-l text-[10px] text-muted-foreground p-1">
                      {view === "weekly" ? `${lang === "ar" ? "أسبوع" : "W"} ${i + 1}` : `${lang === "ar" ? "شهر" : "M"} ${i + 1}`}
                    </div>
                  ))}
                </div>
              </div>
              {/* Phases */}
              <div className="space-y-2">
                {phases.map((p: any, idx: number) => {
                  const start = posFor(p.startDate);
                  const end = posFor(p.endDate);
                  const width = Math.max(2, end - start);
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="w-32 shrink-0 text-xs truncate font-medium">{p.title}</div>
                      <div className="flex-1 relative h-8 bg-muted/30 rounded">
                        <div
                          className={cn(
                            "absolute top-1 bottom-1 rounded-md flex items-center px-2 group hover:shadow-md transition-shadow",
                            p.isMilestone ? "bg-gold/30 border-2 border-gold" : "bg-gradient-to-r from-primary to-primary/70"
                          )}
                          style={{ left: `${start}%`, width: `${width}%` }}
                        >
                          {p.isMilestone && <Flag className="h-3 w-3 text-gold shrink-0" />}
                          <span className="text-[10px] text-white truncate ml-1">{p.progress}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Phase cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {phases.map((p: any) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {p.isMilestone && <Flag className="h-4 w-4 text-gold" />}
                    <h3 className="font-bold text-sm">{p.title}</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{p.isMilestone ? t.timeline.milestone : t.timeline.phase}</Badge>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mb-2">{p.description}</p>}
                <div className="text-xs text-muted-foreground mb-2">
                  {new Date(p.startDate).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")} → {new Date(p.endDate).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t.timeline.progress}</span>
                    <span className="font-medium">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="h-1.5" />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
