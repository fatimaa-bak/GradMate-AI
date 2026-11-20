"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-store";
import { useMembers, useAddMember, useRemoveMember, useAnalyzeTeam } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UserPlus, Users, Crown, Loader2, Sparkles, Trash2, TrendingUp, AlertTriangle,
  CheckCircle2, Target,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  activeProjectId: string | null;
}

export function TeamManagementView({ activeProjectId }: Props) {
  const { t, lang } = useLang();
  const { data: membersData, isLoading } = useMembers(activeProjectId);
  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const analyzeTeam = useAnalyzeTeam();
  const members = membersData?.members || [];

  const [showAdd, setShowAdd] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [form, setForm] = useState({
    email: "", role: "member", skills: "", experience: "intermediate", availability: 20,
  });

  async function handleAdd() {
    if (!form.email) { toast.error(t.auth.requiredField); return; }
    try {
      await addMember.mutateAsync({ ...form, projectId: activeProjectId });
      toast.success(t.common.success);
      setShowAdd(false);
      setForm({ email: "", role: "member", skills: "", experience: "intermediate", availability: 20 });
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleRemove() {
    if (!removeId) return;
    try {
      await removeMember.mutateAsync(removeId);
      toast.success(t.common.success);
    } catch (e: any) { toast.error(e.message); }
    setRemoveId(null);
  }

  async function handleAnalyze() {
    try {
      const res = await analyzeTeam.mutateAsync({ projectId: activeProjectId });
      setAnalysis(res.result);
      toast.success(t.common.success);
    } catch (e: any) { toast.error(e.message); }
  }

  const leader = members.find((m: any) => m.role === "owner");
  const active = members.filter((m: any) => m.assignedTasks > 0).length;
  const skills = members.flatMap((m: any) => (m.skills || "").split(",").map((s: string) => s.trim()).filter(Boolean));
  const skillCounts: Record<string, number> = {};
  skills.forEach((s) => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
  const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" />{t.team.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{members.length} {t.common.members}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAnalyze} disabled={analyzeTeam.isPending} variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 gap-2">
            {analyzeTeam.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-gold" />}
            {analyzeTeam.isPending ? t.team.analyzing : t.team.analyzeSkills}
          </Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="bg-primary gap-2"><UserPlus className="h-4 w-4" />{t.team.addMember}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t.team.addMember}</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label>{t.team.memberForm.email}</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="member@uni.edu" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t.team.memberForm.role}</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">{t.team.member.role}</SelectItem>
                        <SelectItem value="supervisor">{t.sidebar.defenseSimulator}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t.team.memberForm.experience}</Label>
                    <Select value={form.experience} onValueChange={(v) => setForm({ ...form, experience: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">{t.team.experience.beginner}</SelectItem>
                        <SelectItem value="intermediate">{t.team.experience.intermediate}</SelectItem>
                        <SelectItem value="advanced">{t.team.experience.advanced}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t.team.memberForm.skills}</Label>
                  <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Python, React, ..." />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.team.memberForm.availability}</Label>
                  <Input type="number" min={1} max={60} value={form.availability} onChange={(e) => setForm({ ...form, availability: Number(e.target.value) })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAdd(false)}>{t.common.cancel}</Button>
                <Button onClick={handleAdd} disabled={addMember.isPending} className="bg-primary">
                  {addMember.isPending ? t.common.saving : t.common.save}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t.team.totalMembers} value={members.length} icon={Users} color="text-primary" />
        <StatCard label={t.team.teamLeader} value={leader?.user?.name?.split(" ")[0] || "—"} icon={Crown} color="text-gold" />
        <StatCard label={t.team.activeMembers} value={active} icon={CheckCircle2} color="text-emerald-600" />
        <StatCard label={t.team.skillDistribution} value={Object.keys(skillCounts).length} icon={Target} color="text-blue-600" />
      </div>

      {/* Skills */}
      {topSkills.length > 0 && (
        <Card className="p-5">
          <h3 className="font-bold mb-3">{t.team.skillDistribution}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topSkills.map(([skill, count]) => (
              <div key={skill}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{skill}</span>
                  <span className="text-muted-foreground">{count} {t.common.members}</span>
                </div>
                <Progress value={(count / members.length) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Member cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [1,2,3].map((i) => <Card key={i} className="p-5 h-64 animate-pulse bg-muted" />)
        ) : members.map((m: any) => (
          <Card key={m.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-12 w-12 border-2 border-gold/30">
                <AvatarFallback className="bg-primary text-primary-foreground">{m.user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{m.user?.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {m.role === "owner" && <Crown className="h-3.5 w-3.5 text-gold" />}
                  <Badge variant="outline" className="text-[10px]">
                    {m.role === "owner" ? t.team.teamLeader : m.role === "supervisor" ? t.sidebar.defenseSimulator : t.team.member.role}
                  </Badge>
                </div>
              </div>
              {m.role !== "owner" && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setRemoveId(m.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-2 text-sm">
              {m.skills && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t.team.member.skills}</div>
                  <div className="flex flex-wrap gap-1">
                    {m.skills.split(",").map((s: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{s.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">{t.team.member.experience}</div>
                  <div className="text-sm font-medium">{m.experience === "beginner" ? t.team.experience.beginner : m.experience === "advanced" ? t.team.experience.advanced : t.team.experience.intermediate}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t.team.member.availability}</div>
                  <div className="text-sm font-medium">{m.availability}h</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t.team.member.assignedTasks}</div>
                  <div className="text-sm font-medium">{m.assignedTasks || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t.team.member.completedTasks}</div>
                  <div className="text-sm font-medium text-emerald-600">{m.completedTasks || 0}</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t.team.member.workload}</span>
                  <span className="font-medium">{m.workload || 0}%</span>
                </div>
                <Progress value={m.workload || 0} className={cn("h-1.5", (m.workload || 0) > 75 && "[&>div]:bg-red-500")} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Analysis */}
      {analysis && (
        <Card className="p-5 view-enter bg-gradient-to-br from-primary/5 to-gold/5 border-primary/20">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5 text-gold" />
            {t.team.analysisResults}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {analysis.strengths && (
              <Section title={t.team.strengths} icon={CheckCircle2} color="text-emerald-600">
                {analysis.strengths.map((s: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-1 shrink-0" />{s}</li>
                ))}
              </Section>
            )}
            {analysis.skillGaps && (
              <Section title={t.team.gaps} icon={AlertTriangle} color="text-amber-600">
                {analysis.skillGaps.map((g: any, i: number) => (
                  <li key={i} className="text-sm">
                    <div className="font-medium">{g.skill}</div>
                    <div className="text-xs text-muted-foreground">{g.why}</div>
                  </li>
                ))}
              </Section>
            )}
            {analysis.recommendations && (
              <Section title={t.team.recommendations} icon={Target} color="text-primary">
                {analysis.recommendations.map((r: any, i: number) => (
                  <li key={i} className="text-sm">
                    <div className="font-medium">{r.member}</div>
                    <div className="text-xs text-muted-foreground">{r.why}</div>
                  </li>
                ))}
              </Section>
            )}
            {analysis.overloadedMembers && analysis.overloadedMembers.length > 0 && (
              <Section title={t.team.overloaded} icon={TrendingUp} color="text-red-600">
                {analysis.overloadedMembers.map((m: any, i: number) => (
                  <li key={i} className="text-sm">
                    <div className="font-medium">{m.member} ({m.currentLoad})</div>
                    <div className="text-xs text-muted-foreground">{m.suggestion}</div>
                  </li>
                ))}
              </Section>
            )}
          </div>
          {analysis.summary && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            </div>
          )}
        </Card>
      )}

      <AlertDialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.team.removeMember}</AlertDialogTitle>
            <AlertDialogDescription>{t.team.removeConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  return (
    <Card className="p-4">
      <Icon className={`h-5 w-5 mb-2 ${color}`} />
      <div className="text-2xl font-bold truncate">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
}

function Section({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="font-semibold mb-2 flex items-center gap-2"><Icon className={`h-4 w-4 ${color}`} />{title}</h4>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}
