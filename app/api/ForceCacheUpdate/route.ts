import { getCachedData, cacheData, getFullCachedData, cacheGHLData } from "@/lib/cache/redisManager";
import { AnalyticsApiService } from "@/lib/services/api";
import { ATO_TO_GHL_MAPPING } from "@/lib/constants/analytics";
import { createBlankMetaAdsetData } from "@/types/analytics";

export async function GET() {
    const MONTHS_TO_FETCH = 2;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (MONTHS_TO_FETCH - 1)); startDate.setDate(1);
    startDate.setDate(1);
    const endDate = new Date();

    let fetchedMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "1");
    let fullMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "31");
    const ghlFunded = await AnalyticsApiService.fetchGHLFunded();
    const ghlData = await AnalyticsApiService.fetchGHLData();

    const metaMap = new Map<string, any>();

    for (const metaItem of fetchedMetaData) {
        const key = `${metaItem.date.toDateString()}_${ATO_TO_GHL_MAPPING[metaItem.adsetName]}`;
        metaMap.set(key, metaItem);
    }

    for (const ghlItem of ghlFunded) {
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
        }
    }

    await cacheData(fetchedMetaData, fullMetaData);
    await cacheGHLData(ghlData);
    const cachedDate = new Date().toISOString()
    const payload = {
        fetchedMetaData,
        fullMetaData,
        cachedDate,
        ghlData,
    }
    // console.log("API Payload: ", payload);
    return Response.json(payload);
}