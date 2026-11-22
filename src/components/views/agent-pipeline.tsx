"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-store";
import { useMe, api } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Lightbulb, CalendarRange, Users, GraduationCap, Bot, Play, RotateCw, Cpu,
  Loader2, CheckCircle2, Clock, ArrowDown, Sparkles, AlertTriangle,
  CalendarDays, ListChecks, ClipboardList, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  activeProjectId: string | null;
  setView?: (v: any) => void;
}

interface StepState {
  id: "analyzer" | "planner" | "distributor" | "defense";
  name: string;
  nameEn: string;
  status: "pending" | "running" | "done" | "failed";
  inputFrom: string[];
  outputSummary?: string;
  error?: string;
  durationMs?: number;
}

interface PipelineResult {
  runId: string;
  steps: StepState[];
  analysis?: any;
  plan?: any;
  distribution?: any;
  defense?: any;
  finalReport?: string;
}

const STEP_ICONS: Record<StepState["id"], any> = {
  analyzer: Lightbulb,
  planner: CalendarRange,
  distributor: Users,
  defense: GraduationCap,
};

// Simulated step progression while the real pipeline runs server-side, so the
// student sees the agents "handing off" to each other live.
const STEP_DURATIONS_MS = [14_000, 14_000, 12_000, 12_000];

export function AgentPipelineView({ activeProjectId, setView }: Props) {
  const { t, lang } = useLang();
  const { data: meData } = useMe();
  const activeProject = meData?.projects?.find((p: any) => p.id === activeProjectId);

  const [running, setRunning] = useState(false);
  const [simSteps, setSimSteps] = useState<StepState[] | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [totalMs, setTotalMs] = useState<number | null>(null);

  const isRtl = lang === "ar";

  function startSimulation() {
    const steps: StepState[] = [
      { id: "analyzer", name: t.agentPipeline.agentNames.analyzer, nameEn: "Idea Analyzer", status: "pending", inputFrom: [] },
      { id: "planner", name: t.agentPipeline.agentNames.planner, nameEn: "Planner", status: "pending", inputFrom: ["analyzer"] },
      { id: "distributor", name: t.agentPipeline.agentNames.distributor, nameEn: "Task Distributor", status: "pending", inputFrom: ["planner"] },
      { id: "defense", name: t.agentPipeline.agentNames.defense, nameEn: "Defense Prep", status: "pending", inputFrom: ["analyzer", "planner", "distributor"] },
    ];
    setSimSteps(steps);
    // Progress agent i → "running" at staggered times.
    STEP_DURATIONS_MS.forEach((_, i) => {
      const startAt = STEP_DURATIONS_MS.slice(0, i).reduce((a, b) => a + b, 0);
      setTimeout(() => {
        setSimSteps((prev) =>
          prev ? prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : idx < i ? { ...s, status: "done" } : s)) : prev
        );
      }, startAt);
    });
  }

  async function runPipeline() {
    if (!activeProjectId) {
      toast.error(t.agentPipeline.noProject);
      return;
    }
    setRunning(true);
    setResult(null);
    setTotalMs(null);
    startSimulation();
    const t0 = Date.now();
    try {
      const res = await api<PipelineResult>("/api/ai/project-prep", {
        method: "POST",
        body: JSON.stringify({ projectId: activeProjectId }),
      });
      setResult(res);
      setTotalMs(Date.now() - t0);
      toast.success(t.agentPipeline.title);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
      setSimSteps(null);
    }
  }

  const steps = running && simSteps ? simSteps : result?.steps;
  const doneCount = steps ? steps.filter((s) => s.status === "done").length : 0;
  const progress = steps ? Math.round((doneCount / 4) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-gold/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold md:text-2xl">{t.agentPipeline.title}</h1>
                <p className="text-sm text-muted-foreground">{t.agentPipeline.subtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" /> Multi-Agent AI
              </Badge>
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Agentic Orchestration
              </Badge>
              {activeProject && (
                <Badge variant="outline">{activeProject.name}</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              onClick={runPipeline}
              disabled={running || !activeProjectId}
              className="gap-2"
              size="lg"
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.agentPipeline.running}
                </>
              ) : (
                <>
                  {result ? <RotateCw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {result ? t.agentPipeline.rerun : t.agentPipeline.runButton}
                </>
              )}
            </Button>
            {!activeProjectId && (
              <p className="text-xs text-muted-foreground text-center">{t.agentPipeline.noProject}</p>
            )}
            {running && (
              <p className="max-w-[220px] text-xs text-muted-foreground text-center">{t.agentPipeline.runningHint}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Live agent flow */}
      {steps && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Bot className="h-5 w-5 text-primary" />
              {t.agentPipeline.pipelineSteps}
            </h2>
            {running && (
              <span className="text-sm text-muted-foreground">{progress}%</span>
            )}
          </div>
          {running && <Progress value={progress} className="mb-6 h-2" />}

          <div className="space-y-3">
            {steps.map((s, i) => {
              const Icon = STEP_ICONS[s.id];
              const statusColor =
                s.status === "done" ? "border-emerald-500/40 bg-emerald-500/5"
                : s.status === "running" ? "border-primary/40 bg-primary/5"
                : s.status === "failed" ? "border-red-500/40 bg-red-500/5"
                : "border-border";
              return (
                <div key={s.id}>
                  <div className={cn("flex items-start gap-4 rounded-xl border p-4 transition-colors", statusColor)}>
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      s.status === "done" ? "bg-emerald-500/10 text-emerald-600"
                      : s.status === "running" ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                    )}>
                      {s.status === "running" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{isRtl ? s.name : s.nameEn}</span>
                        <Badge
                          variant={s.status === "done" ? "default" : s.status === "running" ? "secondary" : "outline"}
                          className={cn(
                            s.status === "done" && "bg-emerald-600 hover:bg-emerald-600",
                            s.status === "running" && "animate-pulse"
                          )}
                        >
                          {t.agentPipeline.stepStatus[s.status]}
                        </Badge>
                        {s.durationMs != null && s.status === "done" && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {(s.durationMs / 1000).toFixed(1)}{t.agentPipeline.seconds}
                          </span>
                        )}
                      </div>
                      {/* Which agents this one consumes */}
                      {s.inputFrom.length > 0 && (
                        <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          <ArrowDown className="h-3 w-3" />
                          {t.agentPipeline.consumes}:
                          {s.inputFrom.map((src) => (
                            <Badge key={src} variant="outline" className="px-1.5 py-0 text-[10px]">
                              {t.agentPipeline.agentNames[src as keyof typeof t.agentPipeline.agentNames]}
                            </Badge>
                          ))}
                        </p>
                      )}
                      {s.outputSummary && (
                        <p className="text-sm text-foreground/80">{s.outputSummary}</p>
                      )}
                      {s.error && (
                        <p className="flex items-center gap-1 text-sm text-red-500">
                          <AlertTriangle className="h-3.5 w-3.5" /> {s.error}
                        </p>
                      )}
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Final report */}
          <Card className="border-gold/30 bg-gradient-to-br from-gold/5 to-transparent p-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15">
                <Sparkles className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h2 className="font-semibold">{t.agentPipeline.finalReport}</h2>
                <p className="text-xs text-muted-foreground">{t.agentPipeline.finalReportHint}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-3">
              <Badge variant="secondary">4 {t.agentPipeline.agentsCooperated}</Badge>
              {totalMs != null && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {t.agentPipeline.generatedIn} {(totalMs / 1000).toFixed(0)}{t.agentPipeline.seconds}
                </Badge>
              )}
            </div>
            <ScrollArea className="max-h-72">
              <p className="whitespace-pre-line text-sm leading-7">{result.finalReport}</p>
            </ScrollArea>
          </Card>

          {/* Agent outputs in tabs */}
          <Card className="p-6">
            <Tabs defaultValue="analysis">
              <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
                <TabsTrigger value="analysis" className="gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" /> {t.agentPipeline.viewAnalysis}
                </TabsTrigger>
                <TabsTrigger value="plan" className="gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> {t.agentPipeline.viewPlan}
                </TabsTrigger>
                <TabsTrigger value="distribution" className="gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> {t.agentPipeline.viewDistribution}
                </TabsTrigger>
                <TabsTrigger value="defense" className="gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5" /> {t.agentPipeline.viewDefense}
                </TabsTrigger>
              </TabsList>

              {/* Analyzer output */}
              <TabsContent value="analysis" className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <ScoreCard label={t.ideaAnalyzer.results.feasibility} value={result.analysis?.feasibility} />
                  <ScoreCard label={t.ideaAnalyzer.results.innovation} value={result.analysis?.innovation} />
                  <ScoreCard label={t.ideaAnalyzer.results.complexity} value={result.analysis?.complexity} isText />
                </div>
                {result.analysis?.technologies?.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <Cpu className="h-4 w-4 text-primary" /> {t.ideaAnalyzer.results.techRecommendations}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.analysis.technologies.map((tech: any, i: number) => (
                        <Badge key={i} variant="secondary" className="max-w-full whitespace-normal text-right">
                          {tech.name}
                          {tech.why ? ` — ${tech.why}` : ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {result.analysis?.risks?.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <AlertTriangle className="h-4 w-4 text-amber-500" /> {t.ideaAnalyzer.results.risks}
                    </h4>
                    <div className="space-y-2">
                      {result.analysis.risks.map((r: any, i: number) => (
                        <div key={i} className="rounded-lg border p-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{r.description}</span>
                            <Badge variant={r.severity === "high" ? "destructive" : r.severity === "medium" ? "secondary" : "outline"}>
                              {r.severity}
                            </Badge>
                          </div>
                          {r.mitigation && <p className="mt-1 text-muted-foreground">→ {r.mitigation}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Planner output */}
              <TabsContent value="plan" className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {result.plan?.phases?.length || 0} {t.agentPipeline.phasesGenerated}
                  </Badge>
                  <Badge variant="secondary">
                    {result.plan?.estimatedTasks?.length || 0} {t.agentPipeline.tasksGenerated}
                  </Badge>
                  {setView && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setView("projectTimeline")}>
                      <CalendarDays className="h-3.5 w-3.5" /> {t.agentPipeline.goToTimeline}
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {result.plan?.phases?.map((p: any, i: number) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{i + 1}. {p.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.startDate} → {p.endDate}
                        </span>
                      </div>
                      {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                    </div>
                  ))}
                </div>
                {result.plan?.criticalPath?.length > 0 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <h4 className="mb-1 text-sm font-semibold">{t.timeline.phase}</h4>
                    <p className="text-sm text-muted-foreground">{result.plan.criticalPath.join(" → ")}</p>
                  </div>
                )}
              </TabsContent>

              {/* Distributor output */}
              <TabsContent value="distribution" className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {result.distribution?.assignments?.length || 0} {t.agentPipeline.assignmentsGenerated}
                  </Badge>
                  {setView && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setView("smartTasks")}>
                      <ListChecks className="h-3.5 w-3.5" /> {t.agentPipeline.goToTasks}
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {result.distribution?.assignments?.map((a: any, i: number) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{a.taskTitle}</span>
                        <Badge variant="secondary">{a.recommendedMemberName}</Badge>
                      </div>
                      {a.matchingSkills?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {a.matchingSkills.map((sk: string, j: number) => (
                            <Badge key={j} variant="outline" className="text-[10px]">{sk}</Badge>
                          ))}
                        </div>
                      )}
                      {a.reason && <p className="mt-1.5 text-muted-foreground">{a.reason}</p>}
                    </div>
                  ))}
                </div>
                {result.distribution?.warnings?.length > 0 && (
                  <div className="space-y-1">
                    {result.distribution.warnings.map((w: string, i: number) => (
                      <p key={i} className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
                      </p>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Defense output */}
              <TabsContent value="defense" className="space-y-3">
                <Badge variant="secondary">
                  {result.defense?.questions?.length || 0} {t.agentPipeline.questionsGenerated}
                </Badge>
                <div className="space-y-2">
                  {result.defense?.questions?.map((q: any, i: number) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{i + 1}. {q.question}</span>
                        <Badge variant="outline">{q.category}</Badge>
                      </div>
                      {q.basedOn && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t.agentPipeline.basedOn}: {t.agentPipeline.agentNames[q.basedOn as keyof typeof t.agentPipeline.agentNames] ?? q.basedOn}
                        </p>
                      )}
                      {q.modelAnswer && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium text-primary">
                            {t.agentPipeline.modelAnswer}
                          </summary>
                          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{q.modelAnswer}</p>
                        </details>
                      )}
                      {q.tips && (
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-gold" /> {q.tips}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {result.defense?.overallAdvice && (
                  <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
                    <p className="text-sm leading-6">{result.defense.overallAdvice}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </>
      )}

      {/* Empty state */}
      {!result && !running && (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">{t.agentPipeline.title}</h3>
          <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
            {t.agentPipeline.subtitle}
          </p>
          <Separator className="my-6" />
          <div className="mx-auto grid max-w-lg gap-3 text-start sm:grid-cols-2">
            {[
              { icon: Lightbulb, key: "analyzer" as const },
              { icon: CalendarRange, key: "planner" as const },
              { icon: Users, key: "distributor" as const },
              { icon: GraduationCap, key: "defense" as const },
            ].map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-center gap-3 rounded-lg border p-3">
                <Icon className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm font-medium">{t.agentPipeline.agentNames[key]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ScoreCard({ label, value, isText }: { label: string; value: any; isText?: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      {isText ? (
        <Badge variant="secondary">{value ?? "—"}</Badge>
      ) : (
        <>
          <p className="text-2xl font-bold">{value ?? "—"}</p>
          {typeof value === "number" && <Progress value={value} className="mt-1.5 h-1.5" />}
        </>
      )}
    </div>
  );
}
