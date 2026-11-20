"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-store";
import { useCreateProject } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronLeft, ChevronRight, Save, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ViewKey } from "@/components/app-shell";

interface Props {
  setView: (v: ViewKey) => void;
  setActiveProjectId: (id: string | null) => void;
}

export function CreateProjectView({ setView, setActiveProjectId }: Props) {
  const { t, lang } = useLang();
  const createProject = useCreateProject();
  const [step, setStep] = useState(0);
  const [showAnalyzePrompt, setShowAnalyzePrompt] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    specialization: "",
    problemStatement: "",
    objectives: "",
    targetUsers: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    durationWeeks: 12,
    academicYear: "2025-2026",
    supervisorName: "",
    technologies: "",
    resources: "",
    memberCount: 4,
    teamLeader: "",
  });

  const steps = t.createProject.steps;
  const canNext = () => {
    if (step === 0) return form.name.length >= 2 && form.description.length >= 10;
    if (step === 1) return form.startDate && form.endDate && form.durationWeeks > 0;
    return true;
  };

  async function handleCreate() {
    try {
      const res = await createProject.mutateAsync(form);
      setCreatedId(res.project.id);
      setActiveProjectId(res.project.id);
      setShowAnalyzePrompt(true);
      toast.success(t.createProject.success);
    } catch (e: any) {
      toast.error(e.message || t.common.error);
    }
  }

  if (showAnalyzePrompt && createdId) {
    return (
      <div className="container mx-auto px-4 lg:px-6 py-12">
        <Card className="max-w-lg mx-auto p-8 text-center space-y-5">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{t.createProject.success}</h2>
            <p className="text-sm text-muted-foreground">{t.createProject.analyzePrompt}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setView("ideaAnalyzer")} className="bg-primary gap-2">
              <Lightbulb className="h-4 w-4" />
              {t.createProject.analyzeYes}
            </Button>
            <Button variant="outline" onClick={() => setView("dashboard")}>
              {t.createProject.later}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t.createProject.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t.tagline}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-6 overflow-x-auto">
        {steps.map((s: string, i: number) => (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-colors shrink-0",
                i < step ? "bg-emerald-500 text-white" :
                i === step ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("text-[10px] sm:text-xs text-center truncate max-w-[80px]", i === step ? "font-semibold text-primary" : "text-muted-foreground")}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-2 mb-5 transition-colors", i < step ? "bg-emerald-500" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {/* Step 0 — Basic */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.createProject.basic.name}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t.createProject.placeholderName} />
            </div>
            <div className="space-y-2">
              <Label>{t.createProject.basic.description}</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t.createProject.placeholderDesc} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.createProject.basic.category}</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={lang === "ar" ? "تطبيق / ويب / ذكاء اصطناعي..." : "App / Web / AI..."} />
              </div>
              <div className="space-y-2">
                <Label>{t.createProject.basic.specialization}</Label>
                <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder={lang === "ar" ? "علوم حاسب..." : "CS..."} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.createProject.basic.problem}</Label>
              <Textarea rows={2} value={form.problemStatement} onChange={(e) => setForm({ ...form, problemStatement: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.createProject.basic.objectives}</Label>
              <Textarea rows={2} value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.createProject.basic.targetUsers}</Label>
              <Input value={form.targetUsers} onChange={(e) => setForm({ ...form, targetUsers: e.target.value })} />
            </div>
          </div>
        )}

        {/* Step 1 — Schedule */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.createProject.schedule.startDate}</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t.createProject.schedule.endDate}</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.createProject.schedule.durationWeeks}</Label>
                <Input type="number" min={1} max={52} value={form.durationWeeks} onChange={(e) => setForm({ ...form, durationWeeks: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>{t.createProject.schedule.academicYear}</Label>
                <Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2025-2026" />
              </div>
            </div>
            <div className="rounded-lg bg-accent/40 p-3 text-sm text-muted-foreground">
              {form.startDate && form.endDate ? (
                `${t.timeline.weekly}: ${Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))} ${t.common.weeks}`
              ) : "—"}
            </div>
          </div>
        )}

        {/* Step 2 — Team */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.createProject.team.memberCount}</Label>
                <Input type="number" min={1} max={20} value={form.memberCount} onChange={(e) => setForm({ ...form, memberCount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>{t.createProject.team.teamLeader}</Label>
                <Input value={form.teamLeader} onChange={(e) => setForm({ ...form, teamLeader: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.createProject.team.supervisor}</Label>
              <Input value={form.supervisorName} onChange={(e) => setForm({ ...form, supervisorName: e.target.value })} placeholder={lang === "ar" ? "د. ..." : "Dr. ..."} />
            </div>
            <div className="space-y-2">
              <Label>{t.createProject.team.technologies}</Label>
              <Textarea rows={2} value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} placeholder="Python, React, PostgreSQL..." />
            </div>
            <div className="space-y-2">
              <Label>{t.createProject.team.resources}</Label>
              <Textarea rows={2} value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} />
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{t.createProject.review}</h3>
            {[
              { label: t.createProject.basic.name, value: form.name },
              { label: t.createProject.basic.description, value: form.description },
              { label: t.createProject.basic.category, value: form.category },
              { label: t.createProject.schedule.startDate, value: form.startDate },
              { label: t.createProject.schedule.endDate, value: form.endDate },
              { label: t.createProject.schedule.durationWeeks, value: `${form.durationWeeks} ${t.common.weeks}` },
              { label: t.createProject.team.memberCount, value: `${form.memberCount} ${t.common.members}` },
              { label: t.createProject.team.supervisor, value: form.supervisorName || "—" },
              { label: t.createProject.team.technologies, value: form.technologies || "—" },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="col-span-2 font-medium">{row.value || "—"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => setView("myProjects")}>
            {t.common.cancel}
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={createProject.isPending}>
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                {t.createProject.prev}
              </Button>
            )}
            {step < steps.length - 1 ? (
              <>
                <Button variant="outline" onClick={() => toast.info(t.common.saving)}>
                  <Save className="h-4 w-4" />
                  {t.createProject.saveDraft}
                </Button>
                <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="bg-primary">
                  {t.createProject.next}
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </>
            ) : (
              <Button onClick={handleCreate} disabled={createProject.isPending} className="bg-primary">
                {createProject.isPending ? t.common.saving : t.createProject.create}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}


