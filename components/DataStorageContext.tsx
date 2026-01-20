"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { MetaAdsetData, GHLData, createBlankMetaAdsetData } from "@/types/analytics";
import { AnalyticsApiService } from "@/lib/services/api";
import { ATO_TO_GHL_MAPPING } from "@/lib/constants/analytics";

type AnalyticsContextType = {
  metaData: MetaAdsetData[];
  refreshMetaData: () => Promise<void>;
  ready: boolean;
};

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [metaData, setMetaData] = useState<MetaAdsetData[]>([]);
  const [ready, setReady] = useState<boolean>(false);

  const refreshMetaData = useCallback(async () => {
    if(ready) {
      console.log("Data is already ready, skipping refresh.");
      return;
    };
    const MONTHS_TO_FETCH = 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (MONTHS_TO_FETCH - 1));
    startDate.setDate(1);
    const endDate = new Date();

    let fetchedMetaData: MetaAdsetData[] = await AnalyticsApiService.fetchDateData(startDate, endDate);
    const ghlData: GHLData[] = await AnalyticsApiService.fetchGHLData();

    const metaMap = new Map<string, MetaAdsetData>();

    for (const metaItem of fetchedMetaData) {
      const key = `${metaItem.date.toDateString()}_${ATO_TO_GHL_MAPPING[metaItem.adsetName]}`;
      metaMap.set(key, metaItem);
    }

    for (const ghlItem of ghlData) {
      const key = `${new Date(ghlItem.dateFunded).toDateString()}_${ghlItem.adset}`;
      const metaItem = metaMap.get(key);

      if (metaItem) {
        metaItem.conversions += 1;
        metaItem.conversionValue += ghlItem.value;
      } else {
        const newMetaItem = createBlankMetaAdsetData(ghlItem.adset);
        newMetaItem.date = new Date(ghlItem.dateFunded);
        newMetaItem.conversions = 1;
        newMetaItem.conversionValue = ghlItem.value;
        fetchedMetaData.push(newMetaItem);
        metaMap.set(key, newMetaItem);
      }
    }

    setMetaData(fetchedMetaData);
    setReady(true);
    console.log("MetaData refreshed and ready.");
  }, []);

  // optionally, fetch on mount
  useState(() => {
    refreshMetaData();
  });

  return (
    <AnalyticsContext.Provider value={{ metaData, refreshMetaData, ready }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used within AnalyticsProvider");
  return ctx;
}
