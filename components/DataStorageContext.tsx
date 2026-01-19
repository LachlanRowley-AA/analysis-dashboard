"use client";

import { createContext, useContext } from "react";
import { MetaAdsetData } from "@/types/analytics";

type AnalyticsContextType = {
  metaData: MetaAdsetData[];
};

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function AnalyticsProvider({
  children,
  metaData,
}: {
  children: React.ReactNode;
  metaData: MetaAdsetData[];
}) {
  return (
    <AnalyticsContext.Provider value={{ metaData }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used within AnalyticsProvider");
  return ctx;
}
