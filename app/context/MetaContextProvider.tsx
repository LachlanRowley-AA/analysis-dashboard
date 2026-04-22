'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AdSetMetric, GHLData } from "../lib/types";
import { hydrateAdSetMetrics } from "@/utils/hydrate";
import { GHL_TO_ATO_MAPPING } from "@/utils/constants/analytics";
import { createBlankMetaAdsetData } from "../lib/types";

interface MetaDataContextType {
  data: AdSetMetric[] | null;
  loading: boolean;
  error: string | null;
}

const MetaDataContext = createContext<MetaDataContextType | null>(null);

export function MetaDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdSetMetric[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dateToday = new Date();
    const startDate = new Date(dateToday.getFullYear(), dateToday.getMonth() - 1, 1);

    const getMetaData = async (): Promise<AdSetMetric[] | null> => {
      try {
        const response = await fetch(
          `/api/GetMetaData?startDateParam=${startDate.toISOString().split('T')[0]}&endDateParam=${dateToday.toISOString().split('T')[0]}&increment=1`
        );
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const json: AdSetMetric[] = await response.json();
        const hydratedData = hydrateAdSetMetrics(json);
        return hydratedData;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        return null;
      }
    }

    const getGHLData = async (): Promise<GHLData[]> => {
      try {
        const response = await fetch(`/api/GetGHLData`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const json = await response.json();
        return json;
      } catch (err) {
        console.error("Error fetching GHL data:", err instanceof Error ? err.message : err);
        return [];
      }
    }

    const createOrganicAdsets = (metaData: AdSetMetric[]): AdSetMetric[] => {
      const startDate = new Date(dateToday.getFullYear(), dateToday.getMonth() - 1, 1);
      const endDate = dateToday;
      const organicAdsets: AdSetMetric[] = metaData ? metaData : [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        organicAdsets.push(createBlankMetaAdsetData('Organic', new Date(d)));
      }
      return organicAdsets;
    }

    const appendGHLData = (ghlData: GHLData[], metaData: AdSetMetric[]): AdSetMetric[] => {
      for (const ghlEntry of ghlData) {
        console.log(`Processing GHL entry: ${ghlEntry.name} with value ${ghlEntry.value} and date ${ghlEntry.dateFunded}`);
        const mappedAdsetName = GHL_TO_ATO_MAPPING[ghlEntry.adset];
        if (mappedAdsetName) {
          const metaEntry = metaData.find(entry => entry.adsetName === mappedAdsetName &&
            entry.date.toISOString().split('T')[0] === ghlEntry.dateFunded);
          if (metaEntry) {
            console.log(`Found matching Meta entry for GHL entry "${ghlEntry.name}": adset "${metaEntry.adsetName}" on date ${metaEntry.date}`);
            metaEntry.conversions += 1;
            metaEntry.conversionValue += ghlEntry.value;
          }
          else {
            console.log(`No matching Meta entry found for GHL entry "${ghlEntry.name}" on date ${ghlEntry.dateFunded}, adset "${ghlEntry.adset}`);
          }
        }
      }
      console.log("Meta data after appending GHL data:", metaData);
      return metaData;
    }

    const getData = async (): Promise<void> => {
      try {
        const metaData = await getMetaData();
        if(!metaData) {
          setError("Failed to fetch Meta data");
          return;
        }
        const fullAdsets = createOrganicAdsets(metaData);
        console.log("Meta data with organic adsets added:", fullAdsets);
        const ghlData = await getGHLData();
        if (fullAdsets && ghlData) {
          const combinedData = appendGHLData(ghlData, fullAdsets);
          setData(combinedData);
          console.log("Combined Meta and GHL data:", combinedData);
        } else {
          setData(metaData);
          console.log("Meta data without GHL:", metaData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, []);

  return (
    <MetaDataContext.Provider value={{ data, loading, error }}>
      {children}
    </MetaDataContext.Provider>
  );
}

export function useMetaData(): MetaDataContextType {
  const ctx = useContext(MetaDataContext);
  if (!ctx) throw new Error("useMetaData must be used within a MetaDataProvider");
  return ctx;
}