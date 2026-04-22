// import { MetaAdsetData } from "@/types/analytics";

// export function calcDeltaEfficiency(
//     measureParam: number,
//     changeParam: number,
//     priorMeasureParam: number,
//     priorChangeParam: number
// ): number {
//     const MARGIN = 0.05; // 5% margin to account for small fluctuations
//     if (
//         priorMeasureParam <= 0 ||
//         priorChangeParam <= 0 ||
//         measureParam < 0 ||
//         changeParam <= 0
//     ) {
//         return 0;
//     }
//     const priorCPL = priorChangeParam / priorMeasureParam;
//     if (!isFinite(priorCPL) || priorCPL === 0) {
//         return 0;
//     }
//     const expectedLeads = changeParam / priorCPL;
//     if (!isFinite(expectedLeads) || expectedLeads === 0) {
//         return 0;
//     }

//     if (expectedLeads === priorMeasureParam) {
//         return measureParam === priorMeasureParam ? 100 : 0;
//     }

//     let efficiency: number;

//     if (changeParam >= priorChangeParam) {
//         efficiency = ((measureParam - priorMeasureParam) / (expectedLeads - priorMeasureParam)) * 100;
//     } else {
//         efficiency = (measureParam / expectedLeads) * 100;
//     }

//     return Math.round(efficiency);
// }
// export function Delta(curMeta: MetaAdsetData, oldMeta: MetaAdsetData) {

// }