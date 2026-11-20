"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Typed fetch helper
export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error((err as any)?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Hook: current user + projects
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: any; projects: any[] }>("/api/me"),
  });
}

// Hook: tasks for a project
export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => api<{ tasks: any[] }>(`/api/tasks${projectId ? `?projectId=${projectId}` : ""}`),
    enabled: !!projectId,
  });
}

// Hook: members for a project
export function useMembers(projectId?: string) {
  return useQuery({
    queryKey: ["members", projectId],
    queryFn: () => api<{ members: any[] }>(`/api/members${projectId ? `?projectId=${projectId}` : ""}`),
    enabled: !!projectId,
  });
}

// Hook: timeline phases
export function useTimeline(projectId?: string) {
  return useQuery({
    queryKey: ["timeline", projectId],
    queryFn: () => api<{ phases: any[] }>(`/api/timeline${projectId ? `?projectId=${projectId}` : ""}`),
    enabled: !!projectId,
  });
}

// Hook: notifications
export function useNotifications(projectId?: string) {
  return useQuery({
    queryKey: ["notifications", projectId],
    queryFn: () => api<{ notifications: any[] }>(`/api/notifications${projectId ? `?projectId=${projectId}` : ""}`),
    refetchInterval: 30000,
  });
}

// Hook: files
export function useFiles(projectId?: string) {
  return useQuery({
    queryKey: ["files", projectId],
    queryFn: () => api<{ files: any[] }>(`/api/files${projectId ? `?projectId=${projectId}` : ""}`),
    enabled: !!projectId,
  });
}

// Mutations
export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<{ project: any }>("/api/projects", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); qc.invalidateQueries({ queryKey: ["projects"] }); },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<{ project: any }>("/api/projects", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); qc.invalidateQueries({ queryKey: ["projects"] }); },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/projects?id=${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); qc.invalidateQueries({ queryKey: ["projects"] }); },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<{ task: any }>("/api/tasks", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (data, vars) => { qc.invalidateQueries({ queryKey: ["tasks", vars.projectId] }); qc.invalidateQueries({ queryKey: ["me"] }); },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<{ task: any }>("/api/tasks", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["me"] }); },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/tasks?id=${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["me"] }); },
  });
}

export function useAddMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<{ membership: any }>("/api/members", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (data, vars) => { qc.invalidateQueries({ queryKey: ["members", vars.projectId] }); },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/members?id=${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members"] }); },
  });
}

export function useSaveTimeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<{ phases: any[] }>("/api/timeline", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (data, vars) => { qc.invalidateQueries({ queryKey: ["timeline", vars.projectId] }); },
  });
}

export function useUpdatePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<{ phase: any }>("/api/timeline", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["timeline"] }); },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/api/notifications", { method: "PATCH", body: JSON.stringify({ markAllRead: true }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

export function useDeleteAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/api/notifications", { method: "PATCH", body: JSON.stringify({ deleteAll: true }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<{ file: any }>("/api/files", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (data, vars) => { qc.invalidateQueries({ queryKey: ["files", vars.projectId] }); },
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/files?id=${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["files"] }); },
  });
}

// AI mutations
export function useAnalyzeIdea() {
  return useMutation({
    mutationFn: (body: any) => api<{ analysis: any; result: any }>("/api/ai/idea-analyzer", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useAnalyzeTeam() {
  return useMutation({
    mutationFn: (body: any) => api<{ result: any }>("/api/ai/team-analyzer", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useDistributeTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<{ result: any }>("/api/ai/task-distributor", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); },
  });
}

export function useAiPlanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api<{ result: any }>("/api/ai/planner", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["timeline"] }); },
  });
}

export function useAiAssistant() {
  return useMutation({
    mutationFn: (body: any) => api<{ reply: string; conversationId: string }>("/api/ai/assistant", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useDefenseSimulator() {
  return useMutation({
    mutationFn: (body: any) => api<any>("/api/ai/defense-simulator", { method: "POST", body: JSON.stringify(body) }),
  });
}

// Compute project progress
export function computeProgress(tasks: any[]): number {
  if (!tasks?.length) return 0;
  const completed = tasks.filter((t) => t.status === "completed").length;
  return Math.round((completed / tasks.length) * 100);
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function formatRelative(d: Date | string, lang: "ar" | "en" = "ar"): string {
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (lang === "ar") {
    if (diff === 0) return "اليوم";
    if (diff === 1) return "أمس";
    if (diff < 7) return `قبل ${diff} أيام`;
    if (diff < 30) return `قبل ${Math.floor(diff / 7)} أسابيع`;
    return date.toLocaleDateString("ar-EG");
  }
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return date.toLocaleDateString("en-US");
}
