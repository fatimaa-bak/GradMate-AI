"use client";

import { useState, useRef } from "react";
import { useLang } from "@/lib/lang-store";
import { useFiles, useUploadFile, useDeleteFile, formatRelative } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FolderOpen, Upload, Download, Trash2, FileText, FileCode, FileImage, File as FileIcon, Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  activeProjectId: string | null;
}

export function FilesView({ activeProjectId }: Props) {
  const { t, lang } = useLang();
  const { data: filesData, isLoading } = useFiles(activeProjectId);
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const files = filesData?.files || [];

  const [showUpload, setShowUpload] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "document", description: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!form.name) { toast.error(t.auth.requiredField); return; }
    try {
      await uploadFile.mutateAsync({
        ...form,
        projectId: activeProjectId,
        size: 1024 * 50,
        url: `/uploads/${form.name}`,
      });
      toast.success(t.common.success);
      setShowUpload(false);
      setForm({ name: "", type: "document", description: "" });
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteFile.mutateAsync(deleteId);
      toast.success(t.common.success);
    } catch (e: any) { toast.error(e.message); }
    setDeleteId(null);
  }

  function getFileIcon(type: string) {
    if (type === "code") return FileCode;
    if (type === "image") return FileImage;
    if (type === "report" || type === "document") return FileText;
    return FileIcon;
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><FolderOpen className="h-6 w-6 text-primary" />{t.files.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{files.length} {t.files.title}</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-primary gap-2">
          <Upload className="h-4 w-4" />{t.files.upload}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3].map((i) => <Card key={i} className="p-4 h-24 animate-pulse bg-muted" />)}
        </div>
      ) : files.length === 0 ? (
        <Card
          className="p-10 text-center border-dashed cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => setShowUpload(true)}
        >
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">{t.files.dragDrop}</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b bg-muted/30">
                  <th className="text-start font-medium p-3">{t.files.name}</th>
                  <th className="text-start font-medium p-3 hidden sm:table-cell">{t.files.type}</th>
                  <th className="text-start font-medium p-3 hidden md:table-cell">{t.files.size}</th>
                  <th className="text-start font-medium p-3 hidden lg:table-cell">{t.files.uploader}</th>
                  <th className="text-start font-medium p-3 hidden md:table-cell">{t.files.date}</th>
                  <th className="text-start font-medium p-3">{t.files.actions}</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f: any) => {
                  const Icon = getFileIcon(f.type);
                  return (
                    <tr key={f.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{f.name}</div>
                            {f.description && <div className="text-xs text-muted-foreground truncate">{f.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 hidden sm:table-cell"><Badge variant="outline" className="text-[10px]">{f.type}</Badge></td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{formatSize(f.size)}</td>
                      <td className="p-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6"><AvatarFallback className="text-[9px] bg-primary text-primary-foreground">{f.uploader?.name?.charAt(0)}</AvatarFallback></Avatar>
                          <span className="text-xs">{f.uploader?.name}</span>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">{formatRelative(f.createdAt, lang)}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Download")}><Download className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.files.upload}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t.files.name}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="report.pdf" />
            </div>
            <div className="space-y-1.5">
              <Label>{t.files.type}</Label>
              <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="document | report | code | image" />
            </div>
            <div className="space-y-1.5">
              <Label>{t.files.description}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="rounded-lg border-dashed border-2 p-6 text-center text-xs text-muted-foreground">
              {t.files.dragDrop}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>{t.common.cancel}</Button>
            <Button onClick={handleUpload} disabled={uploadFile.isPending} className="bg-primary">
              {uploadFile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {t.files.upload}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.files.delete}</AlertDialogTitle>
            <AlertDialogDescription>{t.team.removeConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
