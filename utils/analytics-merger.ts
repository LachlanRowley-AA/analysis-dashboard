// import { GHL_TO_ATO_MAPPING } from "@/lib/constants/analytics";
// import { createBlankMetaAdsetData, MetaAdsetData, GHLData } from "@/types/analytics";
// import { dayKeyAEDT, monthKeyAEDT, startOfDayInSydney, startOfMonthInSydney } from "@/lib/utils/aedt";

// /**
//  * Normalization helpers (Australia/Sydney – AEDT).
//  */
// export const dayKey = dayKeyAEDT;
// export const monthKey = monthKeyAEDT;

// /**
//  * Shared logic for merging GHL data into Meta adset daily buckets
//  */
// export function mergeGHLIntoMeta(
//     metaData: MetaAdsetData[],
//     ghlArr: GHLData[],
//     cutoffDate?: Date,
//     resetMetrics: boolean = false,
//     daily: boolean = true,
//     demo: boolean = false 
// ) {
//     const metaMap = new Map<string, MetaAdsetData>();

//     // 1. Index existing meta records
//     for (const metaItem of metaData) {
//         const key = daily ? `${dayKey(metaItem.date)}_${metaItem.adsetName}` : `${monthKey(metaItem.date)}_${metaItem.adsetName}`;

//         if (resetMetrics && (!cutoffDate || metaItem.date >= cutoffDate)) {
//             metaItem.lead = 0;
//             metaItem.conversions = 0;
//             metaItem.conversionValue = 0;
//         }
//         metaMap.set(key, metaItem);
//     }

//     // 2. Process GHL Items
//     for (const ghlItem of ghlArr) {
//         const createdDate = new Date(ghlItem.dateCreated);

//         const fundedDate = ghlItem.dateFunded ? new Date(ghlItem.dateFunded) : null;
//         const adsetName = GHL_TO_ATO_MAPPING[ghlItem.adset];

//         if (!adsetName) continue;

//         // Handle Leads (Created Date)
//         if (!cutoffDate || createdDate >= cutoffDate) {
//             const key = daily ? `${dayKey(createdDate)}_${adsetName}` : `${monthKey(createdDate)}_${adsetName}`;
//             let metaItem = metaMap.get(key);

//             if (!metaItem) {
//                 metaItem = createBlankMetaAdsetData(adsetName);
//                 const normalizedDate = daily ? startOfDayInSydney(createdDate) : startOfMonthInSydney(createdDate);
//                 metaItem.date = normalizedDate;
//                 metaData.push(metaItem);
//                 metaMap.set(key, metaItem);
//             }
//             if (metaItem) {
//                 if (demo) {
//                 } else {
//                     metaItem.lead++;
//                 }
//             }
//         }
//         if (cutoffDate && createdDate < cutoffDate) {
//         }

//         // Handle Conversions (Funded Date)
//         if (fundedDate && ghlItem.value > 0) {
//             if (!cutoffDate || fundedDate >= cutoffDate) {
//                 const key = daily ? `${dayKey(fundedDate)}_${adsetName}` : `${monthKey(fundedDate)}_${adsetName}`;
//                 let metaItem = metaMap.get(key);

//                 if (!metaItem) {
//                     metaItem = createBlankMetaAdsetData(adsetName);
//                     const normalizedDate = daily ? startOfDayInSydney(fundedDate) : startOfMonthInSydney(fundedDate);
//                     metaItem.date = normalizedDate;
//                     metaData.push(metaItem);
//                     metaMap.set(key, metaItem);
//                 }

//                 if (metaItem) {
//                     metaItem.conversions++;
//                     metaItem.conversionValue += ghlItem.value;
//                 }
//             }
//         }
//     }
// }