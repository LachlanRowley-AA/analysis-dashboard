"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { GHLData, MetaAdsetData } from "@/types/analytics";

type AnalyticsContextType = {
  metaData: MetaAdsetData[];
  fullData: MetaAdsetData[];
  cachedDate: string;
  ghlData: GHLData[];
  refreshMetaData: (force?: boolean) => Promise<void>;
  updateMetaData: () => Promise<void>;
  ready: boolean;
};

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [metaData, setMetaData] = useState<MetaAdsetData[]>([]);
  const [fullData, setFullData] = useState<MetaAdsetData[]>([]);
  const [ghlData, setGhlData] = useState<GHLData[]>([]);
  const [cachedDate, setCachedDate] = useState<string>("")
  const [ready, setReady] = useState(false);

  // Revive dates from JSON
  const reviveMetaData = useCallback((data: any[]): MetaAdsetData[] => {
    if(!data) {
      const a : MetaAdsetData[] = []
      return a;
    }
    return data.map(item => ({
      ...item,
      date: new Date(item.date),
    }));
  }, []);

  // Fetch full data (force bypass cache optional)
  const refreshMetaData = useCallback(async (force = false) => {
    setReady(false);

    const res = await fetch(force ? "/api/ForceCacheUpdate" : "/api/Analytics");
    const json = await res.json();

    setCachedDate(json.cachedDate || "");
    setMetaData(reviveMetaData(json.fetchedMetaData));
    setFullData(reviveMetaData(json.fullMetaData || []));
    setGhlData(json.ghlData || []);
    setReady(true);
  }, [reviveMetaData]);

  // Update cache and merge with current metaData
  const updateMetaData = useCallback(async () => {
    setReady(false);

    const res = await fetch('/api/UpdateCache');
    const json = await res.json();
    const revivedMeta = reviveMetaData(json.fetchedMetaData);

    console.log("Update func called")

    setCachedDate(json.cachedDate || "");

    // Merge new data with existing data, avoiding duplicates by date+adset
    setMetaData(prev => {
      const map = new Map(prev.map(item => [`${item.date.toDateString()}_${item.adsetName}`, { ...item }]));

      for (const item of revivedMeta) {
        const key = `${item.date.toDateString()}_${item.adsetName}`;
        if (map.has(key)) {
          const existing = map.get(key)!;
          map.set(key, {
            ...existing,
            conversions: item.conversions,
            conversionValue: item.conversionValue
          });
        } else {
          map.set(key, { ...item });
        }
      }

      return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    });


    setReady(true);
  }, [reviveMetaData]);

  useEffect(() => {
    refreshMetaData();
  }, [refreshMetaData]);

  return (
    <AnalyticsContext.Provider value={{ metaData, fullData, cachedDate, ghlData, refreshMetaData, updateMetaData, ready }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used within AnalyticsProvider");
  return ctx;
}
