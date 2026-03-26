export function transformOpportunities(
  allOpportunities: any[],
  customFieldIds: Record<string, string>
) {
  return allOpportunities.map((opp: any) => {
    const row: Record<string, any> = {
      name: opp.name,
      value: opp.monetaryValue,
      stageId: opp.pipelineStageId,
      funded: opp.lastStageChangeAt,
      dateCreated: opp.createdAt,
      owner: opp.assignedTo
    }

    const customLookup: Record<string, any> = {}

    for (const f of opp.customFields ?? []) {
      if (f.fieldValueString) {
        customLookup[f.id] = f.fieldValueString
      } else if (f.fieldValueDate) {
        customLookup[f.id] = new Date(f.fieldValueDate)
      }
    }

    for (const [colName, fieldId] of Object.entries(customFieldIds)) {
      row[colName] = customLookup[fieldId] ?? null
    }

    return row
  })
}
