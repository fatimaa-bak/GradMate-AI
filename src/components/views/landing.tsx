"use client";

import { useLang } from "@/lib/lang-store";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Lightbulb, Users, ListChecks, CalendarRange, TrendingUp, GraduationCap,
  ArrowLeft, Sparkles, CheckCircle2, Bot, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
  isAuthed: boolean;
  onOpenDashboard: () => void;
}

export function LandingView({ onLogin, onRegister, isAuthed, onOpenDashboard }: LandingProps) {
  const { t, lang, toggle } = useLang();

  const features = [
    { icon: Lightbulb, ...t.features.ideaAnalyzer },
    { icon: Users, ...t.features.teamManager },
    { icon: ListChecks, ...t.features.taskDistribution },
    { icon: CalendarRange, ...t.features.projectPlanning },
    { icon: TrendingUp, ...t.features.progressMonitoring },
    { icon: GraduationCap, ...t.features.defenseSimulator },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
          <Logo size="md" />
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => scrollTo("hero")}>{t.nav.home}</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollTo("features")}>{t.nav.features}</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollTo("how")}>{t.nav.howItWorks}</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollTo("about")}>{t.nav.about}</Button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggle}>
              {lang === "ar" ? "EN" : "ع"}
            </Button>
            {!isAuthed ? (
              <>
                <Button variant="ghost" size="sm" onClick={onLogin}>{t.nav.login}</Button>
                <Button size="sm" onClick={onRegister} className="bg-primary hover:bg-primary/90">
                  {t.nav.getStarted}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={onOpenDashboard} className="bg-gold text-gold-foreground hover:bg-gold/90">
                {t.sidebar.dashboard}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 to-background pointer-events-none" />
        <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 lg:px-6 py-16 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                {t.hero.badge}
              </span>
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                <span className="text-brand-gradient">GradMate AI</span>
                <span className="block text-2xl lg:text-3xl mt-2 text-foreground">{t.hero.subtitle}</span>
              </h1>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-xl">
                {t.hero.description}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={isAuthed ? onOpenDashboard : onRegister} className="bg-primary hover:bg-primary/90 gap-2">
                  {t.hero.ctaPrimary}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollTo("features")}>
                  {t.hero.ctaSecondary}
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  <span className="text-muted-foreground">AI-powered</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  <span className="text-muted-foreground">RTL / LTR</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  <span className="text-muted-foreground">{lang === "ar" ? "للجامعات" : "For universities"}</span>
                </div>
              </div>
            </div>

            {/* Dashboard preview */}
            <Card className="relative p-0 overflow-hidden shadow-2xl border-primary/20">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-gold flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">GradMate AI</div>
                      <div className="text-[10px] opacity-80">{t.tagline}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-white/30" />
                    <div className="h-2 w-2 rounded-full bg-white/30" />
                    <div className="h-2 w-2 rounded-full bg-gold" />
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 bg-card">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: t.dashboard.stats.progress, val: "45%", color: "text-primary" },
                    { label: t.dashboard.stats.completedTasks, val: "3", color: "text-gold" },
                    { label: t.dashboard.stats.remainingDays, val: "49", color: "text-foreground" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-lg border bg-background p-2.5">
                      <div className={cn("text-xl font-bold", s.color)}>{s.val}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium">{t.dashboard.progressSection}</span>
                    <span className="text-muted-foreground">45%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-gold rounded-full" style={{ width: "45%" }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  {["بناء نموذج التعرف على الوجوه", "تصميم واجهة لوحة التحكم", "دمج الكاميرا مع النموذج"].map((task, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border bg-background p-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-gold" />
                      <span className="text-[11px] flex-1">{task}</span>
                      <span className="text-[10px] text-muted-foreground">{65 - i * 20}%</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-gradient-to-r from-primary/10 to-gold/10 border border-gold/30 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">{t.dashboard.aiRecommendations}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{lang === "ar" ? "عبء العمل على أحمد مرتفع. فكّر في إعادة توزيع مهمتين." : "Ahmed's workload is high. Consider reassigning two tasks."}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-24 bg-card">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">{t.features.title}</h2>
            <p className="mt-3 text-muted-foreground">{t.features.subtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="group relative p-6 hover:shadow-lg transition-all hover:border-gold/40 overflow-hidden">
                  <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gold/5 group-hover:bg-gold/10 transition-colors" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    <Button variant="link" className="mt-3 p-0 h-auto text-primary group-hover:text-gold" onClick={() => scrollTo("how")}>
                      {t.features.learnMore} →
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 lg:py-24">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">{t.howItWorks.title}</h2>
            <p className="mt-3 text-muted-foreground">{t.howItWorks.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.howItWorks.steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="rounded-2xl border bg-card p-6 hover:shadow-md transition-shadow">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gold text-white font-bold">
                      {i + 1}
                    </div>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <h3 className="font-bold text-base mb-1.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / CTA */}
      <section id="about" className="py-20 lg:py-24 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/20 mb-6">
            <Cpu className="h-8 w-8 text-gold" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">{t.tagline}</h2>
          <p className="max-w-2xl mx-auto text-primary-foreground/80 mb-8">
            {t.hero.description}
          </p>
          <Button size="lg" onClick={isAuthed ? onOpenDashboard : onRegister} className="bg-gold text-gold-foreground hover:bg-gold/90">
            {t.hero.ctaPrimary}
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t mt-auto">
        <div className="container mx-auto px-4 lg:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-3">
              <Logo size="md" />
              <p className="text-sm text-muted-foreground max-w-md">{t.footer.desc}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t.footer.quickLinks}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollTo("hero")} className="hover:text-primary">{t.nav.home}</button></li>
                <li><button onClick={() => scrollTo("features")} className="hover:text-primary">{t.nav.features}</button></li>
                <li><button onClick={() => scrollTo("how")} className="hover:text-primary">{t.nav.howItWorks}</button></li>
                <li><button onClick={() => scrollTo("about")} className="hover:text-primary">{t.nav.about}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button className="hover:text-primary">{t.footer.privacy}</button></li>
                <li><button className="hover:text-primary">{t.footer.terms}</button></li>
                <li><button className="hover:text-primary">{t.footer.contact}</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-xs text-muted-foreground">
            {t.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}

function scrollTo(id: string) {
  if (typeof document !== "undefined") {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }
}
