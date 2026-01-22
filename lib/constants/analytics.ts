export const GHL_TO_ATO_MAPPING: Record<string, string> = {
  "ATO A+": "Advantage plus",
  "ATO Interest Targeting": "Interest Targeting",
  "ATO Custom Audience": "ATO Custom Audience",
  "Machinery A+": "Advantage plus - Machinery & trucks",
  "Machinery Custom Audience": "Machinery & Trucks Custom Audience",
  "Abbie": "Advantage plus - Ads with Abbie",
};

export const ATO_TO_GHL_MAPPING: Record<string, string> = {
  "Advantage plus": "ATO A+",
  "Interest Targeting": "ATO Interest Targeting",
  "ATO Custom Audience": "ATO Custom Audience",
  "Advantage plus - Machinery & trucks": "Machinery A+",
  "Machinery & Trucks Custom Audience": "Machinery Custom Audience",
  "Advantage plus - Ads with Abbie": "Abbie",
};


export const ghlAdsetGrouping: { [key: string]: string } = {
    "ATO A+" : "ATO",
    "ATO Interest Targeting": "ATO",
    "ATO Custom Audience": "ATO",
    "ATO": "ATO",
    "Abbie": "Machinery",
    "Machinery Custom Audience": "Machinery",
    "Machinery A+": "Machinery",
    "Machinery": "Machinery"
}

export const metaAdsetGrouping: Record<string, string> = {
    "Advantage plus": "ATO",
    "Interest Targeting": "ATO",
    "ATO Custom Audience": "ATO",
    "ATO": "ATO",
    "Advantage plus - Ads with Abbie": "Machinery",
    "Machinery & Trucks Custom Audience": "Machinery",
    "Advantage plus - Machinery & trucks": "Machinery",
  };

  export const LTV_VALUES: Record<string, number> = {
    "ATO": 8000,
    "Machinery": 15000,
  };