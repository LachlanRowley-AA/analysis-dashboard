import { useAnalytics } from "../DataStorageContext"
import { GHLMetricsGrid } from "../GHLMetricsGrid"
import { Container, Select } from '@mantine/core'
import { GHLEVGrid } from "../GHLEVGrid"
import { useState } from "react"
import { GHLPipelineGrid } from "../GHLPipelineGrid"
import { getSydneyDateParts } from "@/lib/utils/aedt"

export const GHLTab = () => {
    const { ghlData } = useAnalytics();
    const [selectedAdset, selectAdset] = useState<string | null>('All')
    if (!ghlData) {
        return;
    }
    const { month: sydneyMonth } = getSydneyDateParts(new Date());
    const previousMonth = sydneyMonth === 0 ? 11 : sydneyMonth - 1;
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
    const filteredData = filter.filter(item => item.dateCreated && getSydneyDateParts(new Date(item.dateCreated)).month === sydneyMonth);
    const comparisonData = filter.filter(item => item.dateCreated && getSydneyDateParts(new Date(item.dateCreated)).month === previousMonth);
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