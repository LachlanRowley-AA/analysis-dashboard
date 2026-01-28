"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { GHLData, MetaAdsetData } from "@/types/analytics";

type AnalyticsContextType = {
  metaData: MetaAdsetData[];
  fullData: MetaAdsetData[];
  cachedDate: string;
  ghlData: GHLData[];
  refreshMetaData: (force: boolean) => Promise<void>;
  ready: boolean;
};

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [metaData, setMetaData] = useState<MetaAdsetData[]>([]);
  const [fullData, setFullData] = useState<MetaAdsetData[]>([]);
  const [ghlData, setGhlData] = useState<GHLData[]>([]);
  const [cachedDate, setCachedDate] = useState<string>("")
  const [ready, setReady] = useState(false);

  const refreshMetaData = useCallback(async (force = false) => {
    setReady(false);

    let res;
    if(force) {
      res = await fetch("/api/ForceCacheUpdate");
    } else {
      res = await fetch("/api/Analytics");
    }
    const json = await res.json();
    console.log("JSON Resposne: ", json)
    const revivedMeta = reviveMetaData(json.fetchedMetaData);
    const revivedFull = reviveMetaData(json.fullMetaData);
    setCachedDate(json.cachedDate || "")
    setMetaData(revivedMeta);
    setFullData(revivedFull);

    setGhlData(json.ghlData);
    setReady(true);
  }, []);

  function reviveMetaData(data: any[]): MetaAdsetData[] {
    return data.map(item => ({
      ...item,
      date: new Date(item.date),
    }));
  }


  useEffect(() => {
    refreshMetaData();
  }, [refreshMetaData]);

  return (
    <AnalyticsContext.Provider value={{ metaData, fullData, cachedDate, ghlData, refreshMetaData, ready }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used within AnalyticsProvider");
  return ctx;
}
