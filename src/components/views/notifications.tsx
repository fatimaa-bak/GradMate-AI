"use client";

import { useLang } from "@/lib/lang-store";
import { useNotifications, useMarkAllNotificationsRead, useDeleteAllNotifications, formatRelative } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Trash2, Info, ListChecks, Calendar, Bot, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  activeProjectId?: string | null;
}

export function NotificationsView({ activeProjectId }: Props) {
  const { t, lang } = useLang();
  const { data: notifData } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const deleteAll = useDeleteAllNotifications();
  const notifications = notifData?.notifications || [];

  const typeIcons: Record<string, any> = {
    info: Info, task: ListChecks, deadline: Calendar, ai: Bot, team: Users,
  };
  const typeColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-600",
    task: "bg-emerald-100 text-emerald-600",
    deadline: "bg-amber-100 text-amber-600",
    ai: "bg-primary/10 text-primary",
    team: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 max-w-3xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-primary" />{t.notifications.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{notifications.filter((n: any) => !n.read).length} {t.notifications.unread}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={async () => { try { await markAll.mutateAsync(); toast.success(t.common.success); } catch (e: any) { toast.error(e.message); } }} className="gap-2">
            <CheckCheck className="h-4 w-4" />{t.notifications.markAllRead}
          </Button>
          <Button variant="outline" size="sm" onClick={async () => { try { await deleteAll.mutateAsync(); toast.success(t.common.success); } catch (e: any) { toast.error(e.message); } }} className="gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />{t.notifications.deleteAll}
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="p-10 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">{t.notifications.empty}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const Icon = typeIcons[n.type] || Info;
            return (
              <Card key={n.id} className={cn("p-4 flex items-start gap-3 hover:shadow-sm transition-shadow", !n.read && "border-gold/30 bg-gold/5")}>
                <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg shrink-0", typeColors[n.type] || typeColors.info)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-gold" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">{formatRelative(n.createdAt, lang)}</span>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{t.notifications.types[n.type as keyof typeof t.notifications.types] || n.type}</Badge>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
