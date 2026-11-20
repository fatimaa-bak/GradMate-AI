"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-store";
import { useMe } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import {
  Settings as SettingsIcon, User, Palette, Shield, AlertTriangle, Save, Moon, Sun, Languages,
} from "lucide-react";
import { toast } from "sonner";

export function SettingsView() {
  const { t, lang, setLang } = useLang();
  const { data: meData } = useMe();
  const user = meData?.user;
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    university: user?.university || "",
    faculty: user?.faculty || "",
    department: user?.department || "",
  });

  const [prefs, setPrefs] = useState({
    notifications: true,
    emailDigest: false,
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  async function saveProfile() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success(t.settings.profile.saved);
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 max-w-3xl space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><SettingsIcon className="h-6 w-6 text-primary" />{t.settings.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="profile" className="text-xs sm:text-sm"><User className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t.settings.tabs.profile}</span></TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs sm:text-sm"><Palette className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t.settings.tabs.preferences}</span></TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm"><Shield className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t.settings.tabs.security}</span></TabsTrigger>
          <TabsTrigger value="danger" className="text-xs sm:text-sm"><AlertTriangle className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t.settings.tabs.danger}</span></TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <Avatar className="h-16 w-16 border-2 border-gold">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-bold">{user?.name}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t.settings.profile.name}</Label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t.settings.profile.email}</Label>
                <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>{t.settings.profile.university}</Label>
                <Input value={profile.university} onChange={(e) => setProfile({ ...profile, university: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t.settings.profile.faculty}</Label>
                <Input value={profile.faculty} onChange={(e) => setProfile({ ...profile, faculty: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t.settings.profile.department}</Label>
                <Input value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
              </div>
            </div>
            <Button onClick={saveProfile} disabled={saving} className="bg-primary gap-2">
              <Save className="h-4 w-4" />{saving ? t.common.saving : t.settings.profile.save}
            </Button>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><Languages className="h-4 w-4" />{t.settings.preferences.language}</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">{theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}{t.settings.preferences.theme}</Label>
              <Select value={theme || "light"} onValueChange={(v) => setTheme(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t.topbar.light}</SelectItem>
                  <SelectItem value="dark">{t.topbar.dark}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium text-sm">{t.settings.preferences.notifications}</div>
                <div className="text-xs text-muted-foreground">{t.notifications.title}</div>
              </div>
              <Switch checked={prefs.notifications} onCheckedChange={(v) => setPrefs({ ...prefs, notifications: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium text-sm">{t.settings.preferences.emailDigest}</div>
                <div className="text-xs text-muted-foreground">{t.settings.preferences.emailDigest}</div>
              </div>
              <Switch checked={prefs.emailDigest} onCheckedChange={(v) => setPrefs({ ...prefs, emailDigest: v })} />
            </div>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card className="p-6 space-y-4">
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label>{t.settings.security.currentPassword}</Label>
                <Input type="password" value={security.currentPassword} onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t.settings.security.newPassword}</Label>
                  <Input type="password" value={security.newPassword} onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.settings.security.confirmPassword}</Label>
                  <Input type="password" value={security.confirmPassword} onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })} />
                </div>
              </div>
            </div>
            <Button onClick={() => toast.success(t.settings.profile.saved)} className="bg-primary gap-2">
              <Shield className="h-4 w-4" />{t.settings.security.change}
            </Button>
          </Card>
        </TabsContent>

        {/* Danger */}
        <TabsContent value="danger">
          <Card className="p-6 border-destructive/30">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{t.settings.danger.deleteAccount}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t.settings.danger.deleteConfirm}</p>
                <Button variant="destructive" className="mt-3 gap-2" onClick={() => toast.error(t.settings.danger.deleteConfirm)}>
                  <AlertTriangle className="h-4 w-4" />{t.settings.danger.deleteAccount}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
