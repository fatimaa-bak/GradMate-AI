"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect } from "react";
import { translations, type Lang } from "@/lib/i18n";

type Dict = (typeof translations)["ar"];

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: Dict;
  dir: "rtl" | "ltr";
}

export const useLang = create<LangState>()(
  persist(
    (set, get) => ({
      lang: "ar",
      setLang: (l) => set({ lang: l, t: translations[l], dir: l === "ar" ? "rtl" : "ltr" }),
      toggle: () => {
        const next = get().lang === "ar" ? "en" : "ar";
        set({ lang: next, t: translations[next], dir: next === "ar" ? "rtl" : "ltr" });
      },
      t: translations.ar,
      dir: "rtl",
    }),
    {
      name: "gradmate-lang",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.lang];
          state.dir = state.lang === "ar" ? "rtl" : "ltr";
          applyDir(state.dir);
        }
      },
    }
  )
);

export function applyDir(dir: "rtl" | "ltr") {
  if (typeof document !== "undefined") {
    document.documentElement.dir = dir;
    document.documentElement.lang = dir === "rtl" ? "ar" : "en";
  }
}

// Hook to ensure dir is applied on mount
export function useApplyDir() {
  const dir = useLang((s) => s.dir);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = dir;
      document.documentElement.lang = dir === "rtl" ? "ar" : "en";
    }
  }, [dir]);
}
