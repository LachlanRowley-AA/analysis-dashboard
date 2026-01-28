import { getCachedData, cacheData, getFullCachedData, getDateCached, getCachedGHLData, cacheGHLData } from "@/lib/cache/redisManager";
import { AnalyticsApiService } from "@/lib/services/api";
import { ATO_TO_GHL_MAPPING } from "@/lib/constants/analytics";
import { createBlankMetaAdsetData } from "@/types/analytics";
import { ghlStageFormatter } from "@/lib/formatter";

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
    if (cached.length > 0 && fullCachedData.length > 0) {
        console.log("Returning cached data from Redis.", cached.length);
        return Response.json({ fetchedMetaData: cached, fullMetaData: fullCachedData, cachedDate: date, ghlData, cached: true });
    }

    const MONTHS_TO_FETCH = 2;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (MONTHS_TO_FETCH - 1)); startDate.setDate(1);
    startDate.setDate(1);
    const endDate = new Date();

    let fetchedMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "1");
    let fullMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "31");
    const metaMap = new Map<string, any>();


    for (const metaItem of fetchedMetaData) {
        const key = `${metaItem.date.toDateString()}_${ATO_TO_GHL_MAPPING[metaItem.adsetName]}`;
        metaMap.set(key, metaItem);
        metaItem.lead = 0;
    }

    console.log("metaMap: ", metaMap);

    for (const ghlItem of ghlData) {
        const key = `${new Date(ghlItem.dateCreated).toDateString()}_${ghlItem.adset}`;
        console.log("Looking for key: ", key);
        const metaItem = metaMap.get(key);

        if (metaItem) {
            metaItem.lead++;
            // console.log("Updating meta item: ", metaItem, metaItem.lead);
            if (ghlItem.value > 0) {
                metaItem.conversions += 1;
                metaItem.conversionValue += ghlItem.value;
            }
        } else {
            console.log("Not found")
        }
        // } else {
        //     const newMetaItem = createBlankMetaAdsetData(ghlItem.adset);
        //     newMetaItem.date = new Date(ghlItem.dateFunded);
        //     newMetaItem.lead++;
        //     newMetaItem.adsetName = ghlItem.adset || "";
        //     if (ghlItem.value > 0) {
        //         newMetaItem.conversions = 1;
        //         newMetaItem.conversionValue = ghlItem.value;
        //     }
        //     fetchedMetaData.push(newMetaItem);
        // }
    }
    const cachedDate = new Date().toISOString()
    await cacheData(fetchedMetaData, fullMetaData);
    const payload = {
        fetchedMetaData,
        fullMetaData,
        cachedDate,
        ghlData
    }
    // console.log("API Payload: ", payload);
    return Response.json(payload);
}