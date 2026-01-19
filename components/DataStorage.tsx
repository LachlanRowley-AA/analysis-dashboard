import { GHLData, MetaAdsetData, createBlankMetaAdsetData } from "@/types/analytics"
import { AnalyticsApiService } from "@/lib/services/api"
import { ATO_TO_GHL_MAPPING } from "@/lib/constants/analytics"
export const dynamic = 'force-dynamic';

export async function getAnalyticsData() {
  const MONTHS_TO_FETCH = 2;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - (MONTHS_TO_FETCH - 1));
  startDate.setDate(1);

  const endDate = new Date();

  console.log("Fetching MetaAdsetData from", startDate, "to", endDate);

  let metaData: MetaAdsetData[] =
    await AnalyticsApiService.fetchDateData(startDate, endDate);


  const ghlData: GHLData[] = await AnalyticsApiService.fetchGHLData();

  const metaMap = new Map<string, MetaAdsetData>();

  for (const metaItem of metaData) {
    const key = `${metaItem.date.toDateString()}_${ATO_TO_GHL_MAPPING[metaItem.adsetName]}`;
    metaMap.set(key, metaItem);
    console.log(`MetaAdsetData entry added to map with key ${key}`);
  }

  for (const ghlItem of ghlData) {
    const key = `${new Date(ghlItem.dateFunded).toDateString()}_${ghlItem.adset}`;

    const metaItem = metaMap.get(key);

    if (metaItem) {
      metaItem.conversions += 1;
      metaItem.conversionValue += ghlItem.value;
      console.log(`Updated MetaAdsetData for key ${key}: conversions=${metaItem.conversions}, conversionValue=${metaItem.conversionValue}`);
    }
    else {
      let newMetaItem = createBlankMetaAdsetData(ghlItem.adset);
      newMetaItem.date = new Date(ghlItem.dateFunded);
      newMetaItem.conversions = 1;
      newMetaItem.conversionValue = ghlItem.value;
      metaData.push(newMetaItem);
      metaMap.set(key, newMetaItem);
      console.log(`Created new MetaAdsetData for key ${key}: conversions=${newMetaItem.conversions}, conversionValue=${newMetaItem.conversionValue}`);
    }
  }

  function getMetaData() {
    return metaData;
  }

  function getMetaDataDateRange(start: Date, end: Date, passMetaData?: MetaAdsetData[]) {
    return (passMetaData ?? metaData).filter(item => item.date >= start && item.date <= end);
  }

  function getMetaDataByAdset(adsetId: string, passMetaData?: MetaAdsetData[]) {
    return (passMetaData ?? metaData).filter(item => item.adsetName === adsetId);
  }


  return {
    metaData,
    getMetaData,
    getMetaDataDateRange,
    getMetaDataByAdset,
  };
}
