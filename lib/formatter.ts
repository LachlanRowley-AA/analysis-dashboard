import { GHL_PIPELINE_IDS } from "./constants/ghl";

export type ValueFormat = 'number' | 'currency' | 'percent' | 'decimal';

export function formatValue(
  value: number,
  format: 'number' | 'currency' | 'percent' | 'decimal'
) {
  switch (format) {
    case 'currency':
      return `$${numberFormatter.format(Math.abs(value))}`;
    case 'percent':
      return `${Math.abs(value).toFixed(1)}%`;
    case 'decimal':
      return numberFormatter.format(Math.abs(value));
    default:
      return (Math.abs(value));
  }
}

export const numberFormatter = new Intl.NumberFormat('en-AU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
});

export const ghlStageFormatter = (stageId: string) => {
  return GHL_PIPELINE_IDS[stageId]
}