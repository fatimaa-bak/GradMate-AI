"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-store";
import { useMe, useDeleteProject, computeProgress, daysBetween, formatRelative } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Search, MoreVertical, FolderOpen, Archive, Trash2, Calendar, Users, Clock,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { ViewKey } from "@/components/app-shell";
import { StatusBadge } from "@/components/views/dashboard";

interface Props {
  setView: (v: ViewKey) => void;
  setActiveProjectId: (id: string | null) => void;
}

export function MyProjectsView({ setView, setActiveProjectId }: Props) {
  const { t, lang } = useLang();
  const { data: meData, isLoading } = useMe();
  const deleteProject = useDeleteProject();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  let projects = meData?.projects || [];
  if (search) projects = projects.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));
  if (statusFilter !== "all") projects = projects.filter((p: any) => p.status === statusFilter);
  projects = [...projects].sort((a: any, b: any) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "progress") return computeProgress(b.tasks) - computeProgress(a.tasks);
    return 0;
  });

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProject.mutateAsync(deleteId);
      toast.success(t.common.success);
    } catch (e: any) {
      toast.error(e.message);
    }
    setDeleteId(null);
  };

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">{t.myProjects.title}</h2>
          <p className="text-sm text-muted-foreground">{projects.length} {t.common.tasks}</p>
        </div>
        <Button onClick={() => setView("createProject")} className="bg-primary gap-2">
          <Plus className="h-4 w-4" />
          {t.myProjects.create}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.myProjects.search} className="pr-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={t.myProjects.filterStatus} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.myProjects.all}</SelectItem>
              <SelectItem value="planning">{t.status.planning}</SelectItem>
              <SelectItem value="in_progress">{t.status.in_progress}</SelectItem>
              <SelectItem value="review">{t.status.review}</SelectItem>
              <SelectItem value="completed">{t.status.completed}</SelectItem>
              <SelectItem value="archived">{t.status.archived}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t.myProjects.sortNewest}</SelectItem>
              <SelectItem value="oldest">{t.myProjects.sortOldest}</SelectItem>
              <SelectItem value="progress">{t.myProjects.sortProgress}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <Card key={i} className="p-5 h-48 animate-pulse bg-muted" />)}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-10 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-bold text-lg">{t.myProjects.empty}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t.myProjects.emptyDesc}</p>
          <Button onClick={() => setView("createProject")} className="mt-4 bg-primary gap-2">
            <Plus className="h-4 w-4" />
            {t.myProjects.create}
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: any) => {
            const progress = computeProgress(p.tasks);
            const teamSize = p.members?.length || 0;
            const remaining = p.endDate ? daysBetween(new Date(), p.endDate) : 0;
            return (
              <Card key={p.id} className="p-5 hover:shadow-lg transition-shadow group flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">{p.name}</h3>
                    <Badge variant="outline" className="mt-1 text-[10px]"><StatusBadge status={p.status} t={t} /></Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setActiveProjectId(p.id); setView("projectOverview"); }}>
                        <FolderOpen className="h-4 w-4 mr-2" /> {t.myProjects.open}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setActiveProjectId(p.id); setView("projectOverview"); }}>
                        <Plus className="h-4 w-4 mr-2" /> {t.myProjects.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" /> {t.myProjects.archive}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> {t.myProjects.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{p.description}</p>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t.dashboard.progressSection}</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{teamSize} {t.common.members}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{remaining > 0 ? `${remaining}d` : "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatRelative(p.updatedAt, lang)}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => { setActiveProjectId(p.id); setView("projectOverview"); }}>
                  {t.myProjects.open}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.myProjects.delete}</AlertDialogTitle>
            <AlertDialogDescription>{t.myProjects.deleteConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
