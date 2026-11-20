"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/lang-store";
import {
  useTasks, useMembers, useCreateTask, useUpdateTask, useDeleteTask, useDistributeTasks,
} from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Loader2, Sparkles, Trash2, Edit, Calendar, Clock, GripVertical, Check, X,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/views/dashboard";
import {
  DndContext, DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";

interface Props {
  activeProjectId: string | null;
}

interface Task {
  id: string; title: string; description?: string; projectId: string; assigneeId?: string | null;
  priority: string; status: string; startDate?: string; dueDate?: string;
  estimatedHours?: number | null; requiredSkills?: string; progress?: number;
  assignee?: any;
}

export function SmartTasksView({ activeProjectId }: Props) {
  const { t, lang } = useLang();
  const { data: tasksData } = useTasks(activeProjectId);
  const { data: membersData } = useMembers(activeProjectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const distribute = useDistributeTasks();

  const tasks = tasksData?.tasks || [];
  const members = membersData?.members || [];

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [distribution, setDistribution] = useState<any>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns = [
    { id: "todo", label: t.tasks.columns.todo },
    { id: "in_progress", label: t.tasks.columns.inProgress },
    { id: "overdue", label: t.tasks.columns.overdue },
    { id: "completed", label: t.tasks.columns.completed },
  ];

  const tasksByCol = useMemo(() => {
    const map: Record<string, Task[]> = { todo: [], in_progress: [], overdue: [], completed: [] };
    tasks.forEach((task: any) => {
      if (map[task.status]) map[task.status].push(task);
    });
    return map;
  }, [tasks]);

  async function handleDragEnd(e: DragEndEvent) {
    const taskId = String(e.active.id);
    const newStatus = String(e.over?.id);
    if (!newStatus || !columns.find((c) => c.id === newStatus)) return;
    const task = tasks.find((t: any) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    try {
      await updateTask.mutateAsync({ id: taskId, status: newStatus });
      toast.success(t.common.success);
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleDistribute() {
    try {
      const res = await distribute.mutateAsync({ projectId: activeProjectId });
      setDistribution(res.result);
      toast.success(t.common.success);
    } catch (e: any) { toast.error(e.message); }
  }

  async function applyAssignment(a: any) {
    try {
      await updateTask.mutateAsync({ id: a.taskId, assigneeId: a.recommendedMemberId });
      toast.success(t.common.success);
    } catch (e: any) { toast.error(e.message); }
  }

  async function applyAll() {
    if (!distribution?.assignments) return;
    for (const a of distribution.assignments) {
      try { await updateTask.mutateAsync({ id: a.taskId, assigneeId: a.recommendedMemberId }); } catch {}
    }
    setDistribution(null);
    toast.success(t.common.success);
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            {t.tasks.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{tasks.length} {t.common.tasks}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDistribute} disabled={distribute.isPending} variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 gap-2">
            {distribute.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-gold" />}
            {distribute.isPending ? t.tasks.distributing : t.tasks.smartDistribute}
          </Button>
          <Button className="bg-primary gap-2" onClick={() => { setEditingTask(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" />{t.tasks.addTask}
          </Button>
        </div>
      </div>

      {/* Distribution results */}
      {distribution && (
        <Card className="p-5 view-enter bg-gradient-to-br from-primary/5 to-gold/5 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5 text-gold" />{t.tasks.distributionResults}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={applyAll}><Check className="h-3.5 w-3.5" />{t.tasks.acceptAll}</Button>
              <Button variant="ghost" size="sm" onClick={() => setDistribution(null)}><X className="h-3.5 w-3.5" />{t.tasks.reject}</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-start font-medium pb-2"><input type="checkbox" onChange={(e) => setSelectedAssignments(e.target.checked ? new Set(distribution.assignments.map((a: any) => a.taskId)) : new Set())} /></th>
                  <th className="text-start font-medium pb-2">{t.tasks.col.task}</th>
                  <th className="text-start font-medium pb-2">{t.tasks.col.member}</th>
                  <th className="text-start font-medium pb-2 hidden sm:table-cell">{t.tasks.col.skills}</th>
                  <th className="text-start font-medium pb-2 hidden sm:table-cell">{t.tasks.col.effort}</th>
                  <th className="text-start font-medium pb-2">{t.tasks.col.reason}</th>
                  <th className="text-start font-medium pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {distribution.assignments?.map((a: any, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2"><input type="checkbox" checked={selectedAssignments.has(a.taskId)} onChange={(e) => {
                      const s = new Set(selectedAssignments);
                      if (e.target.checked) s.add(a.taskId); else s.delete(a.taskId);
                      setSelectedAssignments(s);
                    }} /></td>
                    <td className="py-2 font-medium truncate max-w-[160px]">{a.taskTitle}</td>
                    <td className="py-2 text-muted-foreground">{a.recommendedMemberName}</td>
                    <td className="py-2 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(a.matchingSkills || []).slice(0, 3).map((s: string, j: number) => (
                          <Badge key={j} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 hidden sm:table-cell text-xs">{a.estimatedEffort}</td>
                    <td className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">{a.reason}</td>
                    <td className="py-2"><Button size="sm" variant="ghost" onClick={() => applyAssignment(a)}><Check className="h-3 w-3" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Kanban */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {columns.map((col) => (
            <KanbanColumn key={col.id} colId={col.id} label={col.label} tasks={tasksByCol[col.id] || []} members={members} onEdit={(task) => { setEditingTask(task); setShowForm(true); }} onDelete={async (id) => { try { await deleteTask.mutateAsync(id); toast.success(t.common.success); } catch (e: any) { toast.error(e.message); } }} onComplete={async (id) => { try { await updateTask.mutateAsync({ id, status: "completed", progress: 100 }); toast.success(t.common.success); } catch (e: any) { toast.error(e.message); } }} t={t} lang={lang} />
          ))}
        </div>
      </DndContext>

      <TaskFormDialog
        key={editingTask?.id || "new"}
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditingTask(null); }}
        task={editingTask}
        projectId={activeProjectId!}
        members={members}
        onCreate={async (data) => { await createTask.mutateAsync(data); toast.success(t.common.success); }}
        onUpdate={async (data) => { await updateTask.mutateAsync(data); toast.success(t.common.success); }}
        loading={createTask.isPending || updateTask.isPending}
        t={t}
      />
    </div>
  );
}

function KanbanColumn({ colId, label, tasks, members, onEdit, onDelete, onComplete, t, lang }: any) {
  const { setNodeRef } = useDroppable({ id: colId });
  return (
    <div className="flex flex-col rounded-xl border bg-muted/30 min-h-[300px]">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">{label}</h3>
        <Badge variant="secondary" className="text-[10px]">{tasks.length}</Badge>
      </div>
      <div ref={setNodeRef} className="flex-1 p-2 space-y-2 overflow-y-auto custom-scroll max-h-[60vh]">
        {tasks.map((task: any) => (
          <DraggableTask key={task.id} task={task} members={members} onEdit={onEdit} onDelete={onDelete} onComplete={onComplete} t={t} lang={lang} />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">{t.common.noData}</div>
        )}
      </div>
    </div>
  );
}

function DraggableTask({ task, members, onEdit, onDelete, onComplete, t, lang }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const assignee = members.find((m: any) => m.userId === task.assigneeId);
  return (
    <div ref={setNodeRef} style={style} className={cn("group rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow", isDragging && "opacity-50 shadow-lg")}>
      <div className="flex items-start gap-1.5">
        <button {...listeners} {...attributes} className="mt-1 text-muted-foreground hover:text-foreground"><GripVertical className="h-3.5 w-3.5" /></button>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm leading-tight">{task.title}</div>
          {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
          <div className="flex items-center gap-1.5 mt-2">
            <PriorityBadge priority={task.priority} t={t} />
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
            </div>
          )}
          {assignee && (
            <div className="flex items-center gap-1.5 mt-2">
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[8px] bg-primary text-primary-foreground">{assignee.user?.name?.charAt(0)}</AvatarFallback></Avatar>
              <span className="text-xs text-muted-foreground truncate">{assignee.user?.name}</span>
            </div>
          )}
          {task.progress !== undefined && task.progress > 0 && task.progress < 100 && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-1" />
            </div>
          )}
          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.status !== "completed" && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600" onClick={() => onComplete(task.id)}><Check className="h-3 w-3" /></Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(task)}><Edit className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(task.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskFormDialog({ open, onOpenChange, task, projectId, members, onCreate, onUpdate, loading, t }: any) {
  // Derive initial form state from task prop (component remounts via key when task changes)
  const initialForm = task ? {
    title: task.title || "",
    description: task.description || "",
    assigneeId: task.assigneeId || "",
    priority: task.priority || "medium",
    startDate: task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    estimatedHours: task.estimatedHours || 8,
    requiredSkills: task.requiredSkills || "",
  } : {
    title: "", description: "", assigneeId: "", priority: "medium",
    startDate: new Date().toISOString().split("T")[0], dueDate: "",
    estimatedHours: 8, requiredSkills: "",
  };

  const [form, setForm] = useState(initialForm);

  async function submit() {
    if (!form.title) return;
    const data: any = { ...form, projectId, estimatedHours: Number(form.estimatedHours) };
    if (task) await onUpdate({ id: task.id, ...data });
    else await onCreate(data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{task ? t.tasks.actions.edit : t.tasks.addTask}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto custom-scroll">
          <div className="space-y-1.5">
            <Label>{t.tasks.form.title}</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.tasks.form.description}</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.tasks.form.assignee}</Label>
              <Select value={form.assigneeId || "none"} onValueChange={(v) => setForm({ ...form, assigneeId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {members.map((m: any) => (
                    <SelectItem key={m.userId} value={m.userId}>{m.user?.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.tasks.form.priority}</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t.tasks.priority.low}</SelectItem>
                  <SelectItem value="medium">{t.tasks.priority.medium}</SelectItem>
                  <SelectItem value="high">{t.tasks.priority.high}</SelectItem>
                  <SelectItem value="urgent">{t.tasks.priority.urgent}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.tasks.form.startDate}</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.tasks.form.dueDate}</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.tasks.form.estimatedHours}</Label>
              <Input type="number" min={1} value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.tasks.form.requiredSkills}</Label>
              <Input value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} placeholder="Python, React..." />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
          <Button onClick={submit} disabled={loading} className="bg-primary">{loading ? t.common.saving : t.common.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
