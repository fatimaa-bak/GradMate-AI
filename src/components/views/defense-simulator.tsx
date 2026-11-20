"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-store";
import { useDefenseSimulator, formatRelative } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GraduationCap, Loader2, Play, Send, Trophy, CheckCircle2, AlertCircle, Lightbulb,
  MessageSquare, Award, History,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  activeProjectId: string | null;
}

interface Msg { role: "examiner" | "student"; content: string }

export function DefenseSimulatorView({ activeProjectId }: Props) {
  const { t, lang } = useLang();
  const sim = useDefenseSimulator();

  const [mode, setMode] = useState("mixed");
  const [duration, setDuration] = useState(30);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Msg[]>([]);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [started, setStarted] = useState(false);

  async function startSession() {
    try {
      const res = await sim.mutateAsync({ action: "start", projectId: activeProjectId, mode, duration });
      setSessionId(res.sessionId);
      setTranscript([{ role: "examiner", content: res.question }]);
      setStarted(true);
      setFeedback(null);
    } catch (e: any) { toast.error(e.message); }
  }

  async function submitAnswer() {
    if (!answer.trim() || !sessionId) return;
    const next = [...transcript, { role: "student" as const, content: answer }];
    setTranscript(next);
    setAnswer("");
    try {
      const res = await sim.mutateAsync({ action: "answer", sessionId, answer });
      if (res.ended) {
        setFeedback(res.feedback);
        setTranscript([...next, { role: "examiner", content: lang === "ar" ? "[انتهت الجلسة]" : "[Session ended]"}]);
      } else {
        setTranscript([...next, { role: "examiner", content: res.question }]);
      }
    } catch (e: any) { toast.error(e.message); }
  }

  function reset() {
    setStarted(false);
    setSessionId(null);
    setTranscript([]);
    setAnswer("");
    setFeedback(null);
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 max-w-3xl space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-6 w-6 text-gold" />{t.defense.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t.defense.subtitle}</p>
      </div>

      {!started && !feedback && (
        <Card className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t.defense.mode}</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">{t.defense.modes.technical}</SelectItem>
                  <SelectItem value="academic">{t.defense.modes.academic}</SelectItem>
                  <SelectItem value="mixed">{t.defense.modes.mixed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.defense.duration}</Label>
              <Input type="number" min={10} max={60} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>
          <Button onClick={startSession} disabled={sim.isPending} className="w-full bg-primary gap-2">
            {sim.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {t.defense.start}
          </Button>
        </Card>
      )}

      {/* Conversation */}
      {started && !feedback && (
        <>
          <Card className="p-4 max-h-[55vh] overflow-y-auto custom-scroll space-y-4">
            {transcript.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === "student" ? "justify-end" : "justify-start")}>
                {m.role === "examiner" && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed",
                  m.role === "student" ? "bg-primary text-primary-foreground" : "bg-muted border"
                )}>
                  <div className="text-[10px] opacity-70 mb-1">{m.role === "examiner" ? (lang === "ar" ? "اللجنة" : "Committee") : (lang === "ar" ? "الطالب" : "Student")}</div>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {sim.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
                <div className="bg-muted border rounded-2xl p-3.5 flex gap-1">
                  <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
                </div>
              </div>
            )}
          </Card>
          <Card className="p-3">
            <div className="flex gap-2">
              <Textarea
                rows={2}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={t.defense.answerPlaceholder}
                onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) submitAnswer(); }}
                className="flex-1 resize-none"
              />
              <Button onClick={submitAnswer} disabled={sim.isPending || !answer.trim()} className="bg-primary self-end">
                <Send className="h-4 w-4 rtl:rotate-180" />
                {t.defense.submitAnswer}
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="mt-2 text-destructive" onClick={reset}>
              {t.defense.endAndEvaluate}
            </Button>
          </Card>
        </>
      )}

      {/* Feedback */}
      {feedback && (
        <Card className="p-6 view-enter space-y-5">
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-primary/20 mb-3">
              <Trophy className="h-8 w-8 text-gold" />
            </div>
            <h3 className="text-xl font-bold">{t.defense.feedback}</h3>
            <div className="text-4xl font-extrabold text-primary mt-2">{feedback.score}<span className="text-lg text-muted-foreground">/100</span></div>
            <Progress value={feedback.score} className="h-2 mt-2 max-w-xs mx-auto" />
          </div>

          {feedback.strengths && (
            <div>
              <h4 className="font-bold flex items-center gap-2 mb-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" />{t.defense.strengths}</h4>
              <ul className="space-y-1.5">{feedback.strengths.map((s: string, i: number) => (<li key={i} className="text-sm flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-1 shrink-0" />{s}</li>))}</ul>
            </div>
          )}
          {feedback.improvements && (
            <div>
              <h4 className="font-bold flex items-center gap-2 mb-2 text-amber-600"><AlertCircle className="h-4 w-4" />{t.defense.improvements}</h4>
              <ul className="space-y-1.5">{feedback.improvements.map((s: string, i: number) => (<li key={i} className="text-sm flex items-start gap-2"><AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-1 shrink-0" />{s}</li>))}</ul>
            </div>
          )}
          {feedback.tips && (
            <div>
              <h4 className="font-bold flex items-center gap-2 mb-2 text-primary"><Lightbulb className="h-4 w-4" />{t.defense.tips}</h4>
              <ul className="space-y-1.5">{feedback.tips.map((s: string, i: number) => (<li key={i} className="text-sm flex items-start gap-2"><Lightbulb className="h-3.5 w-3.5 text-primary mt-1 shrink-0" />{s}</li>))}</ul>
            </div>
          )}
          {feedback.overallComment && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{feedback.overallComment}</div>
          )}
          <Button onClick={reset} className="w-full bg-primary gap-2"><Play className="h-4 w-4" />{t.defense.newSession}</Button>
        </Card>
      )}
    </div>
  );
}
