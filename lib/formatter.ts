import { GHL_PIPELINE_IDS } from "./constants/ghl";

export const numberFormatter = new Intl.NumberFormat('en-AU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
});

export const ghlStageFormatter = (stageId : string) => {
  return GHL_PIPELINE_IDS[stageId]
}