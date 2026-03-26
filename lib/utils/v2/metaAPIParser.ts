// lib/meta/transformInsights.ts
// Meta API date_start is in AEDT (Australia/Sydney).

import { parseDateOnlyInAEDT } from "../aedt";

const safeNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const safeDate = (value: unknown): Date => {
  if (value == null || value === "") return new Date(0);
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return parseDateOnlyInAEDT(s);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
};

export const getActionValue = (actions: any, actionType: string): number => {
  if (Array.isArray(actions)) {
    const match = actions.find(
      (a) => a && a.action_type === actionType
    );
    return safeNumber(match?.value);
  }
  return 0;
};

export function transformMeta(allInsights: any[]) {
  if (!Array.isArray(allInsights)) {
    return [];
  }

  return allInsights
    .map((row) => {
      const reach = safeNumber(row?.reach);
      const amountSpent = safeNumber(row?.spend);
      const impressions = safeNumber(row?.impressions);

      const linkClicks = getActionValue(row?.actions, 'link_click');
      const leads = getActionValue(row?.actions, 'lead');

      const date = safeDate(row?.date_start);

      return {
        date,
        adsetName: row?.adset_name ?? '',

        reach,
        amountSpent: Number(amountSpent.toFixed(2)),
        linkClicks,
        landingPageView: getActionValue(
          row?.actions,
          'landing_page_view'
        ),
        lead: leads,
        frequency: safeNumber(row?.frequency),

        cost_per_lead: leads > 0
          ? Number((amountSpent / leads).toFixed(2))
          : 0,

        impressions,

        ctr: impressions > 0
          ? Number(((linkClicks / impressions) * 100).toFixed(2))
          : 0,

        conversions: 0,
        conversionValue: 0,

        cpm: safeNumber(row?.cpm),
      };
    })
    .sort(
      (a, b) =>
        a.date.getTime() - b.date.getTime() ||
        a.adsetName.localeCompare(b.adsetName)
    );
}
