import { createBlankMetaAdsetData, GHLData, MetaAdsetData } from "@/types/analytics";
import { ghlAdsetGrouping } from "../constants/analytics";

const ATO_LTV = 8000;
const MACHINERY_LTV = 15000;



export const calculateLTV = (ghlData: GHLData[]): number => {    
    let ltv = 0;
    ghlData.forEach(item => {
        const category = ghlAdsetGrouping[item.adset];
        if (category === "ATO") {
            ltv += ATO_LTV;
        } else if (category === "Machinery") {
            ltv += MACHINERY_LTV;
        }
    });
    return ltv;
};

//Merge multiple adset data entries into one
export const mergeAdsetData = (data: MetaAdsetData[], adsetName: string) => {
    const count = data.length;
    if(data.length == 0) {
        return createBlankMetaAdsetData("");
    }
    console.log(data);
    let mergedData: MetaAdsetData = {
        adsetName: adsetName,
        date: data[data.length-1].date ?? Date.now(),
        reach: data.reduce((sum, item) => sum + item.reach, 0),
        amountSpent: data.reduce((sum, item) => sum + item.amountSpent, 0),
        linkClicks: data.reduce((sum, item) => sum + item.linkClicks, 0),
        landingPageView: data.reduce((sum, item) => sum + item.landingPageView, 0),
        lead: data.reduce((sum, item) => sum + item.lead, 0),
        frequency: data.reduce((sum, item) => sum + item.frequency, 0) / count,
        costPerLead: data.reduce((sum, item) => sum + item.costPerLead, 0) / count,
        impressions: data.reduce((sum, item) => sum + item.impressions, 0),
        ctr: data.reduce((sum, item) => sum + item.ctr, 0) / count,
        conversions: data.reduce((sum, item) => sum + item.conversions, 0),
        conversionValue: data.reduce((sum, item) => sum + item.conversionValue, 0),
        cpm: data.reduce((sum, item) => sum + item.cpm, 0) / count,
    };
    return mergedData;
}
