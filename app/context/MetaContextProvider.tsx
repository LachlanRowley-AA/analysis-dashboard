'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';

import { AdSetMetric, GHLData } from '../lib/types';
import { hydrateAdSetMetrics } from '@/utils/hydrate';
import { GHL_TO_ATO_MAPPING } from '@/utils/constants/analytics';
import { createBlankMetaAdsetData } from '../lib/types';

interface MetaDataContextType {
  data: AdSetMetric[] | null;
  allData: AdSetMetric[] | null;
  ghlData: GHLData[] | null;
  loading: boolean;
  error: string | null;
  statusMessage: string | null;
  refetch: () => Promise<void>;
}

const MetaDataContext = createContext<MetaDataContextType | null>(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStartDate(today: Date): Date {
  return new Date(today.getFullYear(), today.getMonth() - 6, 1);
}

function toDateString(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Given a target date string and a sorted ascending list of week-boundary date
 * strings for a specific adset, return the largest bucket date that is <=
 * target (i.e. the weekly bucket this day falls into).
 */
function findNearestWeekBucket(
  targetDate: string,
  sortedBuckets: string[]
): string | null {
  let result: string | null = null;

  for (const bucket of sortedBuckets) {
    if (bucket <= targetDate) result = bucket;
    else break;
  }

  return result;
}

// ---------------------------------------------------------------------------
// API fetchers
// ---------------------------------------------------------------------------

async function fetchMetaData(
  startDate: Date,
  endDate: Date
): Promise<AdSetMetric[]> {
  const url =
    `/api/GetMetaDataQuarterly` +
    `?startDateParam=${toDateString(startDate)}` +
    `&endDateParam=${toDateString(endDate)}` +
    `&increment=7`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Meta API error: ${response.status}`);
  }

  const json: AdSetMetric[] = await response.json();

  return hydrateAdSetMetrics(json);
}

async function fetchMetaDataAll(): Promise<AdSetMetric[]> {
  const response = await fetch(`/api/GetMetaDataAll`);

  if (!response.ok) {
    throw new Error(`Meta All API error: ${response.status}`);
  }

  const json: AdSetMetric[] = await response.json();

  return hydrateAdSetMetrics(json);
}

async function fetchGHLData(stageId?: string): Promise<GHLData[]> {
  const url = stageId ? `/api/GetGHLData?stageId=${stageId}` : `/api/GetGHLData`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GHL API error: ${response.status}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Data transforms
// ---------------------------------------------------------------------------

/** Append one organic AdSetMetric per day in [startDate, endDate]. */
function appendOrganicAdsets(
  adsets: AdSetMetric[],
  startDate: Date,
  endDate: Date
): AdSetMetric[] {
  const result = [...adsets];

  for (
    let d = new Date(startDate);
    d <= endDate;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    result.push(createBlankMetaAdsetData('Organic', new Date(d)));
  }

  return result;
}

/**
 * Merge GHL lead/conversion data into the weekly Meta adset list.
 */
function mergeGHLData(
  ghlData: GHLData[],
  adsets: AdSetMetric[]
): AdSetMetric[] {
  // -------------------------------------------------------------------------
  // Build index structures
  // -------------------------------------------------------------------------

  // "adsetName|dateString" -> index in adsets[]
  const indexMap = new Map<string, number>();

  // adsetName -> sorted ascending list of week bucket date strings
  const bucketsByAdset = new Map<string, string[]>();

  adsets.forEach((entry, i) => {
    const dateStr = toDateString(entry.date);

    indexMap.set(`${entry.adsetName}|${dateStr}`, i);

    if (!bucketsByAdset.has(entry.adsetName)) {
      bucketsByAdset.set(entry.adsetName, []);
    }

    bucketsByAdset.get(entry.adsetName)!.push(dateStr);
  });

  // Sort buckets
  for (const buckets of bucketsByAdset.values()) {
    buckets.sort();
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function resolveEntry(
    adsetName: string,
    dateStr: string
  ): AdSetMetric | null {
    // Exact match
    const exactIdx = indexMap.get(`${adsetName}|${dateStr}`);

    if (exactIdx !== undefined) {
      return adsets[exactIdx];
    }

    // Snap backwards to nearest week bucket
    const buckets = bucketsByAdset.get(adsetName);

    if (buckets) {
      const nearest = findNearestWeekBucket(dateStr, buckets);

      if (nearest) {
        const snapIdx = indexMap.get(`${adsetName}|${nearest}`);

        if (snapIdx !== undefined) {
          return adsets[snapIdx];
        }
      }
    }

    return null;
  }

  function createFallbackEntry(
    adsetName: string,
    dateStr: string
  ): AdSetMetric {
    const newEntry = createBlankMetaAdsetData(
      adsetName,
      new Date(dateStr)
    );

    const newIdx = adsets.length;

    adsets.push(newEntry);

    indexMap.set(`${adsetName}|${dateStr}`, newIdx);

    if (!bucketsByAdset.has(adsetName)) {
      bucketsByAdset.set(adsetName, []);
    }

    const buckets = bucketsByAdset.get(adsetName)!;

    const insertAt = buckets.findIndex((b) => b > dateStr);

    if (insertAt === -1) {
      buckets.push(dateStr);
    } else {
      buckets.splice(insertAt, 0, dateStr);
    }

    return newEntry;
  }

  // -------------------------------------------------------------------------
  // Main merge loop
  // -------------------------------------------------------------------------

  for (const ghlEntry of ghlData) {
    const isOrganic = ghlEntry.adset === 'Organic';

    const mappedAdsetName =
      GHL_TO_ATO_MAPPING[ghlEntry.adset];

    const adsetName = mappedAdsetName ?? ghlEntry.adset;

    // Funded conversion
    if (!isOrganic && ghlEntry.dateFunded) {
      const dateStr = toDateString(ghlEntry.dateFunded);

      const entry =
        resolveEntry(adsetName, dateStr) ??
        createFallbackEntry(adsetName, dateStr);

      entry.conversions += 1;
      entry.conversionValue += ghlEntry.value;
    }

    // Organic lead
    if (isOrganic && ghlEntry.dateCreated) {
      const dateStr = toDateString(ghlEntry.dateCreated);
      const fundedDateStr = ghlEntry.dateFunded ? toDateString(ghlEntry.dateFunded) : undefined;

      const entry =
        resolveEntry(adsetName, dateStr) ??
        createFallbackEntry(adsetName, dateStr);
      entry.lead += 1;

      if (fundedDateStr) {
        const fundedEntry =
          resolveEntry(adsetName, fundedDateStr) ??
          createFallbackEntry(adsetName, fundedDateStr);
        fundedEntry.conversions += 1;
        fundedEntry.conversionValue += ghlEntry.value;
      }
    }
  }

  return adsets;
}

/**
 * Merge GHL data into aggregated adset rows returned by /GetMetaDataAll
 *
 * Since there is only ONE entry per adset, we simply accumulate all
 * matching GHL values into that single entry.
 */
function mergeGHLDataAll(
  ghlData: GHLData[],
  adsets: AdSetMetric[]
): AdSetMetric[] {
  const adsetMap = new Map<string, AdSetMetric>();

  for (const adset of adsets) {
    adsetMap.set(adset.adsetName, adset);
  }

  for (const ghlEntry of ghlData) {
    const isOrganic = ghlEntry.adset === 'Organic';

    const mappedAdsetName =
      GHL_TO_ATO_MAPPING[ghlEntry.adset];

    const adsetName = mappedAdsetName ?? ghlEntry.adset;

    let entry = adsetMap.get(adsetName);

    // Create fallback entry if missing
    if (!entry) {
      entry = createBlankMetaAdsetData(
        adsetName,
        new Date()
      );

      adsets.push(entry);
      adsetMap.set(adsetName, entry);
    }

    // Funded conversions
    if (!isOrganic && ghlEntry.dateFunded) {
      entry.conversions += 1;
      entry.conversionValue += ghlEntry.value;
    }

    // Organic leads
    if (isOrganic && ghlEntry.dateCreated) {
      entry.lead += 1;
      if (ghlEntry.dateFunded) {
        entry.conversions += 1;
        entry.conversionValue += ghlEntry.value;
      }
    }
  }

  return adsets;
}

// ---------------------------------------------------------------------------
// Context & Provider
// ---------------------------------------------------------------------------

export function MetaDataProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] = useState<AdSetMetric[] | null>(null);
  const [allData, setAllData] = useState<AdSetMetric[] | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [ghlData, setGHLData] = useState<GHLData[] | null>(null);

  const todayRef = useRef<Date>(new Date());

  const startDateRef = useRef<Date>(
    getStartDate(todayRef.current)
  );

  const getData = useCallback(async (): Promise<void> => {
    const today = todayRef.current;

    const startDate = startDateRef.current;

    setLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      // ---------------------------------------------------------------------
      // Fetch Meta weekly data
      // ---------------------------------------------------------------------

      setStatusMessage('Fetching Meta data...');

      const metaData = await fetchMetaData(
        startDate,
        today
      );

      // ---------------------------------------------------------------------
      // Build organic rows
      // ---------------------------------------------------------------------

      setStatusMessage('Building adsets...');

      const withOrganic = appendOrganicAdsets(
        metaData,
        startDate,
        today
      );

      // ---------------------------------------------------------------------
      // Fetch GHL
      // ---------------------------------------------------------------------

      setStatusMessage('Fetching GHL data...');

      const ghlData = await fetchGHLData();
      setGHLData(ghlData);


      // ---------------------------------------------------------------------
      // Merge weekly data
      // ---------------------------------------------------------------------

      setStatusMessage('Combining weekly data...');

      const combined = mergeGHLData(
        ghlData,
        withOrganic
      );

      setData(combined);

      // ---------------------------------------------------------------------
      // Fetch aggregated Meta data
      // ---------------------------------------------------------------------

      setStatusMessage('Fetching aggregated Meta data...');

      const metaAllData = await fetchMetaDataAll();

      // ---------------------------------------------------------------------
      // Merge aggregated data
      // ---------------------------------------------------------------------

      setStatusMessage('Combining aggregated data...');

      const combinedAll = mergeGHLDataAll(
        ghlData,
        metaAllData
      );

      setAllData(combinedAll);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unknown error occurred'
      );
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  return (
    <MetaDataContext.Provider
      value={{
        data,
        allData,
        loading,
        error,
        statusMessage,
        ghlData,
        refetch: getData,
      }}
    >
      {children}
    </MetaDataContext.Provider>
  );
}

export function useMetaData(): MetaDataContextType {
  const ctx = useContext(MetaDataContext);

  if (!ctx) {
    throw new Error(
      'useMetaData must be used within a MetaDataProvider'
    );
  }

  return ctx;
}