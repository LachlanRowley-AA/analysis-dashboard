import { getCachedData, cacheData, getFullCachedData, getDateCached, getCachedGHLData, cacheGHLData, getDateCachedUnix } from "@/lib/cache/redisManager";
import { AnalyticsApiService } from "@/lib/services/api";
import { ATO_TO_GHL_MAPPING } from "@/lib/constants/analytics";
import { createBlankMetaAdsetData } from "@/types/analytics";
import { ghlStageFormatter } from "@/lib/formatter";
import { GHLData } from "@/types/analytics";


const dayKey = (date: Date) =>
    `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;

const monthKey = (date: Date) =>
    `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

function mergeGHLIntoDailyMeta(metaData: any[], ghlFunded: GHLData[]) {
    const metaMap = new Map<string, any>();

    for (const metaItem of metaData) {
        const key = `${dayKey(metaItem.date)}_${ATO_TO_GHL_MAPPING[metaItem.adsetName]}`;
        metaMap.set(key, metaItem);
    }

    for (const ghlItem of ghlFunded) {
        const date = ghlItem.dateFunded ? new Date(ghlItem.dateFunded) : new Date(ghlItem.dateCreated);
        const key = `${dayKey(date)}_${ghlItem.adset}`;
        const metaItem = metaMap.get(key);

        if (metaItem) {
            if (ghlItem.value > 0) {
                metaItem.conversions += 1;
                metaItem.conversionValue += ghlItem.value;
            }
        } else {
            const newMetaItem = createBlankMetaAdsetData(ghlItem.adset);
            newMetaItem.date = date;
            if (ghlItem.value > 0) {
                newMetaItem.conversions = 1;
                newMetaItem.conversionValue = ghlItem.value;
            }
            newMetaItem.lead++;
            metaData.push(newMetaItem);
        }
    }
}

function mergeGHLIntoMonthlyMeta(metaData: any[], ghlFunded: GHLData[]) {
    const metaMap = new Map<string, any>();

    for (const metaItem of metaData) {
        const key = `${monthKey(metaItem.date)}_${ATO_TO_GHL_MAPPING[metaItem.adsetName]}`;
        metaMap.set(key, metaItem);
    }

    for (const ghlItem of ghlFunded) {
        if (ghlItem.value <= 0) {
            continue
        }
        const date = new Date(ghlItem.dateFunded);
        const key = `${monthKey(date)}_${ghlItem.adset}`;
        const metaItem = metaMap.get(key);

        if (metaItem) {
            metaItem.conversions += 1;
            metaItem.conversionValue += ghlItem.value;
        } else {
            const newMetaItem = createBlankMetaAdsetData(ghlItem.adset);

            // snap to month bucket
            newMetaItem.date = new Date(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                1
            );

            console.log("New meta item created", newMetaItem)
            
            newMetaItem.conversions = 1;
            newMetaItem.conversionValue = ghlItem.value;
            metaData.push(newMetaItem);
        }
    }
}



export async function GET() {
    let ghlData = await getCachedGHLData();
    if (!(ghlData.length > 0)) {
        ghlData = await AnalyticsApiService.fetchGHLData()
        cacheGHLData(ghlData);
    }
    const ghlFunded = await AnalyticsApiService.fetchGHLFunded();
    const cached = await getCachedData();
    const fullCachedData = await getFullCachedData();


    const date = await getDateCached();
    const unixDate = await getDateCachedUnix();
    if (cached.length > 0 && fullCachedData.length > 0) {
        return Response.json({ fetchedMetaData: cached, fullMetaData: fullCachedData, cachedDate: date, ghlData, cached: true });
    }

    const MONTHS_TO_FETCH = 2;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (MONTHS_TO_FETCH - 1)); startDate.setDate(1);
    startDate.setDate(1);
    const endDate = new Date();

    const ADSET_START = new Date(2025, 7, 8);

    let fetchedMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "1");
    let fullMetaData = await AnalyticsApiService.fetchDateData(ADSET_START, endDate, "31");

    mergeGHLIntoDailyMeta(fetchedMetaData, ghlData);
    mergeGHLIntoMonthlyMeta(fullMetaData, ghlData);


    const cachedDate = new Date().toISOString()
    await cacheData(fetchedMetaData, fullMetaData);
    const payload = {
        fetchedMetaData,
        fullMetaData,
        cachedDate,
        ghlData
    }
    return Response.json(payload);
}