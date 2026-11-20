"use client";

import { useLang } from "@/lib/lang-store";
import { cn } from "@/lib/utils";

export function Logo({ size = "md", showText = true, variant = "default" }: { size?: "sm" | "md" | "lg"; showText?: boolean; variant?: "default" | "light" }) {
  const { t } = useLang();
  const sizes = {
    sm: { img: "h-8 w-8", title: "text-base", sub: "text-[10px]" },
    md: { img: "h-10 w-10", title: "text-lg", sub: "text-[11px]" },
    lg: { img: "h-16 w-16", title: "text-3xl", sub: "text-sm" },
  };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/gradmate-logo.png"
        alt={t.logoAlt}
        className={cn(s.img, "object-contain rounded-lg")}
      />
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn(s.title, "font-extrabold tracking-tight", variant === "light" ? "text-white" : "text-foreground")}>
            GradMate <span className="text-gold">AI</span>
          </span>
          <span className={cn(s.sub, "text-muted-foreground", variant === "light" && "text-white/70")}>
            {t.tagline}
          </span>
        </div>
      )}
    </div>
  );
}
