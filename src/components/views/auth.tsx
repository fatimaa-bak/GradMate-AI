"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-store";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Sparkles, GraduationCap, Users, Lightbulb } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AuthViewProps {
  mode: "login" | "register" | "forgot";
  onSwitchMode: (m: "login" | "register" | "forgot") => void;
  onBackToLanding: () => void;
}

export function AuthView({ mode, onSwitchMode, onBackToLanding }: AuthViewProps) {
  const { t, toggle, lang } = useLang();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("demo@gradmate.ai");
  const [loginPass, setLoginPass] = useState("gradmate123");
  const [remember, setRemember] = useState(true);

  // Register form
  const [reg, setReg] = useState({
    name: "", email: "", password: "", confirm: "",
    university: "", faculty: "", department: "",
  });

  // Forgot
  const [forgotEmail, setForgotEmail] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPass,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(t.auth.invalidCreds);
      return;
    }
    router.refresh();
    window.location.reload();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (reg.password !== reg.confirm) { setError(t.auth.passwordMismatch); return; }
    if (reg.password.length < 8 || !/[A-Za-z]/.test(reg.password) || !/[0-9]/.test(reg.password)) {
      setError(t.auth.weakPassword); return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reg),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error === "email_taken" ? t.auth.emailTaken : data.error);
        setLoading(false);
        return;
      }
      // Auto-login
      await signIn("credentials", { email: reg.email, password: reg.password, redirect: false });
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || t.auth.invalidCreds);
      setLoading(false);
    }
  }

  function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setResetSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Branding panel */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <Logo size="md" variant="light" />
          <Button variant="ghost" size="sm" onClick={onBackToLanding} className="text-primary-foreground hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t.common.back}
          </Button>
        </div>

        <div className="relative space-y-6 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/10 px-4 py-1.5 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            {t.hero.badge}
          </span>
          <h1 className="text-3xl lg:text-5xl font-extrabold leading-tight">
            GradMate <span className="text-gold">AI</span>
            <span className="block text-xl lg:text-2xl mt-2 opacity-90">{t.hero.subtitle}</span>
          </h1>
          <p className="text-primary-foreground/80 text-sm lg:text-base leading-relaxed">
            {t.hero.description}
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { icon: Lightbulb, label: t.features.ideaAnalyzer.title },
              { icon: Users, label: t.features.teamManager.title },
              { icon: GraduationCap, label: t.features.defenseSimulator.title },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="rounded-xl bg-white/10 backdrop-blur-sm p-3 text-center">
                  <Icon className="h-5 w-5 mx-auto mb-1.5 text-gold" />
                  <div className="text-[10px] leading-tight">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative text-xs text-primary-foreground/60">
          {t.footer.copyright}
        </div>
      </div>

      {/* Form panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between lg:hidden">
            <Logo size="sm" />
            <Button variant="ghost" size="sm" onClick={toggle}>{lang === "ar" ? "EN" : "ع"}</Button>
          </div>
          <div className="hidden lg:flex justify-end">
            <Button variant="ghost" size="sm" onClick={toggle}>{lang === "ar" ? "EN" : "ع"}</Button>
          </div>

          {mode === "login" && (
            <>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold">{t.auth.welcome}</h2>
                <p className="text-sm text-muted-foreground">{t.auth.subtitleLogin}</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-2">
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pr-9" placeholder="you@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t.auth.password}</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPass ? "text" : "password"} required value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="pr-9 pl-9" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                    <Label htmlFor="remember" className="text-sm cursor-pointer">{t.auth.remember}</Label>
                  </div>
                  <button type="button" onClick={() => onSwitchMode("forgot")} className="text-xs text-primary hover:underline">
                    {t.auth.forgot}
                  </button>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                  {loading ? t.auth.loading : t.auth.loginBtn}
                </Button>
              </form>
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-xs">
                <div className="font-semibold text-primary mb-0.5">{t.auth.demoAccount}</div>
                <div className="text-muted-foreground">{t.auth.demoHint}</div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {t.auth.noAccount}{" "}
                <button onClick={() => onSwitchMode("register")} className="text-primary font-medium hover:underline">
                  {t.auth.registerLink}
                </button>
              </p>
            </>
          )}

          {mode === "register" && (
            <>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold">{t.auth.welcomeRegister}</h2>
                <p className="text-sm text-muted-foreground">{t.auth.subtitleRegister}</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-2">
                  <Label htmlFor="r-name">{t.auth.fullName}</Label>
                  <Input id="r-name" required value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} placeholder="أحمد محمد" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="r-uni">{t.auth.university}</Label>
                    <Input id="r-uni" required value={reg.university} onChange={(e) => setReg({ ...reg, university: e.target.value })} placeholder="جامعة..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="r-fac">{t.auth.faculty}</Label>
                    <Input id="r-fac" required value={reg.faculty} onChange={(e) => setReg({ ...reg, faculty: e.target.value })} placeholder="كلية..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-dep">{t.auth.department}</Label>
                  <Input id="r-dep" required value={reg.department} onChange={(e) => setReg({ ...reg, department: e.target.value })} placeholder="قسم..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-email">{t.auth.email}</Label>
                  <Input id="r-email" type="email" required value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} placeholder="you@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="r-pass">{t.auth.password}</Label>
                    <div className="relative">
                      <Input id="r-pass" type={showPass ? "text" : "password"} required value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} className="pl-9" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="r-conf">{t.auth.confirmPassword}</Label>
                    <div className="relative">
                      <Input id="r-conf" type={showPass2 ? "text" : "password"} required value={reg.confirm} onChange={(e) => setReg({ ...reg, confirm: e.target.value })} className="pl-9" />
                      <button type="button" onClick={() => setShowPass2(!showPass2)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPass2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                  {loading ? t.auth.loading : t.auth.registerBtn}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground">
                {t.auth.haveAccount}{" "}
                <button onClick={() => onSwitchMode("login")} className="text-primary font-medium hover:underline">
                  {t.auth.loginLink}
                </button>
              </p>
            </>
          )}

          {mode === "forgot" && (
            <>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold">{t.auth.forgotTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.auth.forgotDesc}</p>
              </div>
              {resetSent ? (
                <Alert>
                  <AlertDescription>{t.auth.resetSent}</AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="f-email">{t.auth.email}</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="f-email" type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pr-9" placeholder="you@example.com" />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                    {t.auth.resetBtn}
                  </Button>
                </form>
              )}
              <p className="text-center text-sm text-muted-foreground">
                <button onClick={() => onSwitchMode("login")} className="text-primary font-medium hover:underline">
                  {t.auth.backToLogin}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
