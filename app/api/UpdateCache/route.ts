import { updateCacheData, getDateCached, updateGHLCache } from "@/lib/cache/redisManager";
import { AnalyticsApiService } from "@/lib/services/api";
import { ATO_TO_GHL_MAPPING, GHL_TO_ATO_MAPPING } from "@/lib/constants/analytics";
import { createBlankMetaAdsetData } from "@/types/analytics";

/**
 * Helpers to normalise date keys
 */
const dayKey = (date: Date) =>
    `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;

const monthKey = (date: Date) =>
    `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

export async function GET() {
    let startDate = new Date(await getDateCached());
    startDate.setHours(0,0,0,0)
    const endDate = new Date();
    endDate.setHours(23,59,59)
    const startOfMonth = new Date(startDate);
    startOfMonth.setDate(1);

    let dailyMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "1");
    let fullMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "31");
    let ghlData = await AnalyticsApiService.fetchGHLFunded();

    console.log("daily", dailyMetaData);

    const dayFilteredGHL = ghlData.filter(item => new Date(item.dateFunded) >= startDate);
    const monthFilteredGHL = ghlData.filter(item => new Date(item.dateFunded) >= startOfMonth);

    const dailyMetaMap = new Map<string, any>();
    const monthlyMetaMap = new Map<string, any>();


    //Initialize maps
    for (const metaItem of fullMetaData) {
        const key = `${monthKey(metaItem.date)}_${metaItem.adsetName}`;
        metaItem.conversions = 0;
        metaItem.conversionValue = 0;
        monthlyMetaMap.set(key, metaItem);
    }

    for (const metaItem of dailyMetaData) {
        const key = `${dayKey(metaItem.date)}_${metaItem.adsetName}`;
        // console.log('monthly adjustment count', monthAdjustmentCount)

        //Remove cached data from same day --> Stop duplicate counting from partial day
        metaItem.conversions = 0;
        metaItem.conversionValue = 0;
        dailyMetaMap.set(key, metaItem);
    }


    // //Monthly data already caught by same day update
    // let monthAdjustmentCount = 0
    // let monthAdjustmentValue = 0



    for (const ghlItem of dayFilteredGHL) {
        const date = new Date(ghlItem.dateFunded);
        const key = `${dayKey(date)}_${GHL_TO_ATO_MAPPING[ghlItem.adset]}`;
        const metaItem = dailyMetaMap.get(key);
        if (metaItem) {
            metaItem.conversions += 1;
            metaItem.conversionValue += ghlItem.value;
        } else {
            const newMetaItem = createBlankMetaAdsetData(GHL_TO_ATO_MAPPING[ghlItem.adset]);
            newMetaItem.date = date;
            newMetaItem.conversions = 1;
            newMetaItem.conversionValue = ghlItem.value;
            dailyMetaData.push(newMetaItem);
        }
    }

    for (const ghlItem of monthFilteredGHL) {
        const date = new Date(ghlItem.dateFunded);
        const key = `${monthKey(date)}_${GHL_TO_ATO_MAPPING[ghlItem.adset]}`;
        const metaItem = monthlyMetaMap.get(key);

        if (metaItem) {
            metaItem.conversions += 1;
            metaItem.conversionValue += ghlItem.value;
        } else {
            const newMetaItem = createBlankMetaAdsetData(GHL_TO_ATO_MAPPING[ghlItem.adset]);
            // snap to month bucket
            newMetaItem.date = new Date(Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                1
            ));

            newMetaItem.conversions = 1;
            newMetaItem.conversionValue = ghlItem.value;
            fullMetaData.push(newMetaItem);
        }
    }

    // console.log("fetched meta data", dailyMetaData)

    await updateCacheData(dailyMetaData, fullMetaData, startDate);
    await updateGHLCache(dayFilteredGHL);

    const cachedDate = new Date().toISOString();

    return Response.json({
        dailyMetaData,
        fullMetaData,
        ghlData,
        cachedDate,
    });
}
