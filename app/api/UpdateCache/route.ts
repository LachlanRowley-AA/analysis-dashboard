import { updateCacheData, getDateCached } from "@/lib/cache/redisManager";
import { AnalyticsApiService } from "@/lib/services/api";
import { ATO_TO_GHL_MAPPING } from "@/lib/constants/analytics";
import { createBlankMetaAdsetData } from "@/types/analytics";

/**
 * Helpers to normalise date keys
 */
const dayKey = (date: Date) =>
    `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;

const monthKey = (date: Date) =>
    `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

export async function GET() {
    const startDate = new Date(await getDateCached());
    const temp = await getDateCached();

    const endDate = new Date();
    const startOfMonth = new Date(startDate);
    startOfMonth.setDate(1);

    let fetchedMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "1");
    let fullMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "31");
    let ghlData = await AnalyticsApiService.fetchGHLFunded(startOfMonth);


    ghlData = ghlData.filter(item => new Date(item.dateFunded) >= startDate);

    const dailyMetaMap = new Map<string, any>();

    //Monthly data already caught by same day update
    let monthAdjustmentCount = 0
    let monthAdjustmentValue = 0

    for (const metaItem of fetchedMetaData) {
        const key = `${dayKey(metaItem.date)}_${ATO_TO_GHL_MAPPING[metaItem.adsetName]}`;
        //Remove cached data from same day --> Stop duplicate counting

        monthAdjustmentCount += metaItem.conversionValue;
        monthAdjustmentValue += metaItem.conversions;

        metaItem.conversions = 0;
        metaItem.conversionValue = 0;
        dailyMetaMap.set(key, metaItem);
    }

    for (const ghlItem of ghlData) {
        const date = new Date(ghlItem.dateFunded);
        const key = `${dayKey(date)}_${ghlItem.adset}`;
        const metaItem = dailyMetaMap.get(key);

        if (metaItem) {
            metaItem.conversions += 1;
            metaItem.conversionValue += ghlItem.value;
        } else {
            const newMetaItem = createBlankMetaAdsetData(ghlItem.adset);
            newMetaItem.date = date;
            newMetaItem.conversions = 1;
            newMetaItem.conversionValue = ghlItem.value;
            fetchedMetaData.push(newMetaItem);
        }
    }


    const monthlyMetaMap = new Map<string, any>();

    for (const metaItem of fullMetaData) {
        const key = `${monthKey(metaItem.date)}_${ATO_TO_GHL_MAPPING[metaItem.adsetName]}`;
        monthlyMetaMap.set(key, metaItem);
    }
    
    for (const ghlItem of ghlData) {
        const date = new Date(ghlItem.dateFunded);
        const key = `${monthKey(date)}_${ghlItem.adset}`;
        const metaItem = monthlyMetaMap.get(key);

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

            newMetaItem.conversions = 1;
            newMetaItem.conversionValue = ghlItem.value;
            fullMetaData.push(newMetaItem);
        }
    }

    await updateCacheData(fetchedMetaData, fullMetaData);

    const cachedDate = new Date().toISOString();

    return Response.json({
        fetchedMetaData,
        fullMetaData,
        ghlData,
        cachedDate,
    });
}
