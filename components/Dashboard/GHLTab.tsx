import { ghlAdsetGrouping } from "@/lib/constants/analytics"
import { ghlStageFormatter } from "@/lib/formatter"
import { useAnalytics } from "../DataStorageContext"
import { GHL_PIPELINE_IDS } from "@/lib/constants/ghl"
import { GHLMetricsGrid } from "../GHLMetricsGrid"
import { Stepper, Container, Text, Select } from '@mantine/core'
import { GHLEVGrid } from "../GHLEVGrid"
import { useState } from "react"
import { GHLPipelineGrid } from "../GHLPipelineGrid"

export const GHLTab = () => {
    const { ghlData } = useAnalytics();
    const [selectedAdset, selectAdset] = useState<string | null>('All')
    if (!ghlData) {
        return;
    }
    const adsetNames = [
        'All',
        ...Array.from(
            new Set(
                ghlData
                    .map(item => item.adset)
                    .filter((name): name is string => Boolean(name))
            )
        ),
    ];
    let filter = selectedAdset && selectedAdset !== 'All' ? ghlData.filter(item => item.adset === selectedAdset) : ghlData;
    let previousMonth = new Date().getMonth() - 1;
    if (previousMonth < 0) {
        previousMonth = 11;
    }
    const filteredData = filter.filter(item => item.dateCreated && new Date(item.dateCreated).getMonth() == new Date().getMonth())
    const comparisonData = filter.filter(item => item.dateCreated && new Date(item.dateCreated).getMonth() == previousMonth)
    return (
        <Container size='xl'>
            <Select
                data={adsetNames.map(name => ({ value: name, label: name }))}
                value={selectedAdset}
                onChange={selectAdset}
                py='md'
                styles={{
                    input: {
                        color: 'white',
                        backgroundColor: 'gray',
                        borderColor: 'gray'
                    }
                }}

            />
            <GHLPipelineGrid data={filter} />
            <GHLMetricsGrid data={filteredData} comparison={comparisonData} showComparison={true} />
            <GHLEVGrid data={ghlData} />
        </Container>
    )
}