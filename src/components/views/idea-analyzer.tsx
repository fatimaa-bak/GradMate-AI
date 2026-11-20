"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-store";
import { useAnalyzeIdea, useMe } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lightbulb, Sparkles, Loader2, Save, RefreshCw, Download, Check, MessageCircle,
  TrendingUp, AlertTriangle, Rocket, Shield, Cpu, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  activeProjectId: string | null;
}

export function IdeaAnalyzerView({ activeProjectId }: Props) {
  const { t, lang } = useLang();
  const analyze = useAnalyzeIdea();
  const { data: meData } = useMe();
  const activeProject = meData?.projects?.find((p: any) => p.id === activeProjectId);

  const [form, setForm] = useState({
    ideaTitle: activeProject?.name || "",
    ideaDescription: activeProject?.description || "",
    problem: activeProject?.problemStatement || "",
    audience: activeProject?.targetUsers || "",
    resources: activeProject?.technologies || "",
    teamSize: activeProject?.members?.length || 4,
    duration: activeProject?.durationWeeks || 12,
    technologies: activeProject?.technologies || "",
  });
  const [result, setResult] = useState<any>(null);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [discussion, setDiscussion] = useState<{ role: string; content: string }[]>([]);
  const [discInput, setDiscInput] = useState("");
  const [discLoading, setDiscLoading] = useState(false);

  async function runAnalysis() {
    if (!form.ideaTitle || !form.ideaDescription) {
      toast.error(t.auth.requiredField);
      return;
    }
    try {
      const res = await analyze.mutateAsync({ ...form, projectId: activeProjectId });
      setResult(res.result);
      toast.success(t.common.success);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function sendDiscussion() {
    if (!discInput.trim() || !result) return;
    const userMsg = { role: "user", content: discInput };
    const newHist = [...discussion, userMsg];
    setDiscussion(newHist);
    setDiscInput("");
    setDiscLoading(true);
    try {
      const r = await fetch("/api/ai/idea-discuss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, history: discussion, analysisId: null }),
      });
      const data = await r.json();
      setDiscussion([...newHist, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      toast.error(e.message);
    }
    setDiscLoading(false);
  }

  function exportAnalysis() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `idea-analysis-${form.ideaTitle}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.common.success);
  }

  const complexityLabel = (c: string) => {
    if (c === "low") return t.ideaAnalyzer.results.complexity + ": " + (lang === "ar" ? "منخفض" : "Low");
    if (c === "high") return t.ideaAnalyzer.results.complexity + ": " + (lang === "ar" ? "عالٍ" : "High");
    return t.ideaAnalyzer.results.complexity + ": " + (lang === "ar" ? "متوسط" : "Medium");
  };

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 max-w-5xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-gold" />
          {t.ideaAnalyzer.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t.ideaAnalyzer.subtitle}</p>
      </div>

      {/* Form */}
      <Card className="p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.ideaAnalyzer.form.ideaTitle}</Label>
            <Input value={form.ideaTitle} onChange={(e) => setForm({ ...form, ideaTitle: e.target.value })} placeholder="Smart Attendance System" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.ideaAnalyzer.form.description}</Label>
            <Textarea rows={3} value={form.ideaDescription} onChange={(e) => setForm({ ...form, ideaDescription: e.target.value })} placeholder={t.createProject.placeholderDesc} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.ideaAnalyzer.form.problem}</Label>
            <Textarea rows={2} value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.ideaAnalyzer.form.audience}</Label>
            <Input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.ideaAnalyzer.form.resources}</Label>
            <Input value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.ideaAnalyzer.form.teamSize}</Label>
            <Input type="number" min={1} max={20} value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.ideaAnalyzer.form.duration}</Label>
            <Input type="number" min={1} max={52} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t.ideaAnalyzer.form.technologies}</Label>
            <Input value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} placeholder="Python, React, OpenCV..." />
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t">
          <p className="text-xs text-muted-foreground">{t.ideaAnalyzer.disclaimer}</p>
          <Button onClick={runAnalysis} disabled={analyze.isPending} className="bg-primary gap-2">
            {analyze.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-gold" />}
            {analyze.isPending ? t.ideaAnalyzer.analyzing : t.ideaAnalyzer.analyze}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4 view-enter">
          {/* Scores */}
          <div className="grid sm:grid-cols-3 gap-3">
            <ScoreCard
              label={t.ideaAnalyzer.results.feasibility}
              value={result.feasibility}
              explanation={result.feasibilityExplanation}
              icon={TrendingUp}
              color="text-emerald-600"
            />
            <ScoreCard
              label={t.ideaAnalyzer.results.innovation}
              value={result.innovation}
              explanation={result.innovationExplanation}
              icon={Sparkles}
              color="text-gold"
            />
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold">{t.ideaAnalyzer.results.complexity}</span>
              </div>
              <Badge className={cn(
                "text-sm",
                result.complexity === "low" ? "bg-emerald-100 text-emerald-700" :
                result.complexity === "high" ? "bg-red-100 text-red-700" :
                "bg-amber-100 text-amber-700"
              )}>
                {result.complexity === "low" ? (lang === "ar" ? "منخفض" : "Low") :
                 result.complexity === "high" ? (lang === "ar" ? "عالٍ" : "High") :
                 (lang === "ar" ? "متوسط" : "Medium")}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">{result.complexityExplanation}</p>
            </Card>
          </div>

          {/* Tech recommendations */}
          {result.technologies && (
            <Card className="p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" />{t.ideaAnalyzer.results.techRecommendations}</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {result.technologies.map((tech: any, i: number) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="font-medium text-sm">{tech.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{tech.why}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Risks */}
          {result.risks && (
            <Card className="p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" />{t.ideaAnalyzer.results.risks}</h3>
              <div className="space-y-2">
                {result.risks.map((r: any, i: number) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium">{r.description}</span>
                      <Badge variant="outline" className={cn(
                        "text-[10px] border-0",
                        r.severity === "low" ? "bg-emerald-100 text-emerald-700" :
                        r.severity === "high" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {r.severity === "low" ? (lang === "ar" ? "منخفضة" : "Low") :
                         r.severity === "high" ? (lang === "ar" ? "عالية" : "High") :
                         (lang === "ar" ? "متوسطة" : "Medium")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground"><span className="font-medium">{t.ideaAnalyzer.results.mitigation}:</span> {r.mitigation}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Improvements */}
          {result.improvements && (
            <Card className="p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Rocket className="h-5 w-5 text-emerald-600" />{t.ideaAnalyzer.results.improvements}</h3>
              <div className="space-y-1.5">
                {result.improvements.map((imp: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Roadmap */}
          {result.roadmap && (
            <Card className="p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><BookOpen className="h-5 w-5 text-purple-600" />{t.ideaAnalyzer.results.roadmap}</h3>
              <div className="space-y-3">
                {result.roadmap.map((step: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{step.step}</div>
                      {i < result.roadmap.length - 1 && <div className="flex-1 w-px bg-border min-h-8" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="text-sm font-medium">{step.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{step.details}</div>
                      {step.estimatedDays && <Badge variant="outline" className="mt-1 text-[10px]">{step.estimatedDays} {t.common.days}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => toast.success(t.common.success)}><Save className="h-4 w-4" />{t.ideaAnalyzer.actions.save}</Button>
            <Button variant="outline" onClick={runAnalysis}><RefreshCw className="h-4 w-4" />{t.ideaAnalyzer.actions.reanalyze}</Button>
            <Button variant="outline" onClick={exportAnalysis}><Download className="h-4 w-4" />{t.ideaAnalyzer.actions.export}</Button>
            <Button variant="outline" onClick={() => toast.success(t.common.success)}><Check className="h-4 w-4" />{t.ideaAnalyzer.actions.accept}</Button>
            <Button variant="outline" onClick={() => setShowDiscussion(!showDiscussion)}><MessageCircle className="h-4 w-4" />{t.ideaAnalyzer.actions.discuss}</Button>
          </div>

          {/* Discussion */}
          {showDiscussion && (
            <Card className="p-5 view-enter">
              <h3 className="font-bold mb-3 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" />{t.ideaAnalyzer.discussion}</h3>
              <ScrollArea className="h-64 custom-scroll mb-3 rounded-lg border p-3 bg-muted/30">
                <div className="space-y-3">
                  {discussion.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">{t.ideaAnalyzer.discussionPlaceholder}</p>
                  )}
                  {discussion.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] rounded-lg p-2.5 text-sm",
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border"
                      )}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {discLoading && (
                    <div className="flex justify-start">
                      <div className="bg-card border rounded-lg p-3 flex gap-1">
                        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
                        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
                        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input value={discInput} onChange={(e) => setDiscInput(e.target.value)} placeholder={t.ideaAnalyzer.discussionPlaceholder} onKeyDown={(e) => e.key === "Enter" && sendDiscussion()} />
                <Button onClick={sendDiscussion} disabled={discLoading}>{t.assistant.send}</Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, value, explanation, icon: Icon, color }: { label: string; value: number; explanation?: string; icon: any; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="flex items-end justify-between mb-1.5">
        <span className={`text-3xl font-bold ${color}`}>{value || 0}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <Progress value={value || 0} className="h-1.5 mb-2" />
      <p className="text-xs text-muted-foreground">{explanation}</p>
    </Card>
  );
}
