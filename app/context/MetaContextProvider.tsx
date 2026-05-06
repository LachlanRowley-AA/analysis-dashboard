'use client';
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { AdSetMetric, GHLData } from "../lib/types";
import { hydrateAdSetMetrics } from "@/utils/hydrate";
import { GHL_TO_ATO_MAPPING } from "@/utils/constants/analytics";
import { createBlankMetaAdsetData } from "../lib/types";

interface MetaDataContextType {
  data: AdSetMetric[] | null;
  loading: boolean;
  error: string | null;
  statusMessage: string | null;
  refetch: () => Promise<void>;
}

const MetaDataContext = createContext<MetaDataContextType | null>(null);

export function MetaDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdSetMetric[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const dateTodayRef = useRef<Date>(new Date());
  const startDateRef = useRef<Date>(
    new Date(dateTodayRef.current.getFullYear(), dateTodayRef.current.getMonth() - 2, 1)
  );

  const getMetaData = async (startDate: Date, dateToday: Date): Promise<AdSetMetric[] | null> => {
    try {
      const response = await fetch(
        `/api/GetMetaData?startDateParam=${startDate.toISOString().split('T')[0]}&endDateParam=${dateToday.toISOString().split('T')[0]}&increment=1`
      );
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const json: AdSetMetric[] = await response.json();
      return hydrateAdSetMetrics(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      return null;
    }
  };

  const getGHLData = async (): Promise<GHLData[]> => {
    try {
      const response = await fetch(`/api/GetGHLData`);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error("Error fetching GHL data:", err instanceof Error ? err.message : err);
      return [];
    }
  };

  const createOrganicAdsets = (metaData: AdSetMetric[], startDate: Date, dateToday: Date): AdSetMetric[] => {
    const organicAdsets: AdSetMetric[] = [...metaData];
    for (let d = new Date(startDate); d <= dateToday; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      organicAdsets.push(createBlankMetaAdsetData('Organic', new Date(d)));
    }
    return organicAdsets;
  };

  const appendGHLData = (ghlData: GHLData[], metaData: AdSetMetric[]): AdSetMetric[] => {
    for (const ghlEntry of ghlData) {
      const isOrganic = ghlEntry.adset === "Organic";
      const mappedAdsetName = GHL_TO_ATO_MAPPING[ghlEntry.adset];

      if (mappedAdsetName) {
        if (ghlEntry.dateFunded) {
          const fundedEntry = metaData.find(entry =>
            entry.adsetName === mappedAdsetName &&
            entry.date.toISOString().split('T')[0] === ghlEntry.dateFunded.split('T')[0]
          );

          if (fundedEntry) {
            if (!isOrganic) {
              if (ghlEntry.value > 0) {
                fundedEntry.conversions += 1;
                fundedEntry.conversionValue += ghlEntry.value;
              }
            } else {
              fundedEntry.conversions += 1;
              fundedEntry.conversionValue += ghlEntry.value;
            }
          }
        }

        if (isOrganic && ghlEntry.dateCreated) {
          const leadEntry = metaData.find(entry =>
            entry.adsetName === mappedAdsetName &&
            entry.date.toISOString().split('T')[0] === ghlEntry.dateCreated.split('T')[0]
          );

          if (leadEntry) {
            leadEntry.lead += 1;
          }
        }
      }
    }

    return metaData;
  };

  const getData = async (): Promise<void> => {
    const dateToday = dateTodayRef.current;
    const startDate = startDateRef.current;

    try {
      setLoading(true);
      setError(null);

      setStatusMessage("Fetching Meta data...");
      const metaData = await getMetaData(startDate, dateToday);
      if (!metaData) {
        setError("Failed to fetch Meta data");
        return;
      }

      setStatusMessage("Building adsets...");
      const fullAdsets = createOrganicAdsets(metaData, startDate, dateToday);

      setStatusMessage("Fetching GHL data...");
      const ghlData = await getGHLData();

      setStatusMessage("Combining data...");
      if (fullAdsets && ghlData) {
        const combinedData = appendGHLData(ghlData, fullAdsets);
        setData(combinedData);
      } else {
        setData(metaData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <MetaDataContext.Provider value={{ data, loading, error, statusMessage, refetch: getData }}>
      {children}
    </MetaDataContext.Provider>
  );
}

export function useMetaData(): MetaDataContextType {
  const ctx = useContext(MetaDataContext);
  if (!ctx) throw new Error("useMetaData must be used within a MetaDataProvider");
  return ctx;
}