import { ghlAdsetGrouping } from "@/lib/constants/analytics"
import { ghlStageFormatter } from "@/lib/formatter"
import { useAnalytics } from "../DataStorageContext"
import { GHL_PIPELINE_IDS } from "@/lib/constants/ghl"
import { GHLMetricsGrid } from "../GHLMetricsGrid"
import { Stepper, Container, Text } from '@mantine/core'
import { GHLEVGrid } from "../GHLEVGrid"

export const GHLTab = () => {
    const { ghlData } = useAnalytics();
    if (!ghlData) {
        return;
    }

    let previousMonth = new Date().getMonth() - 1;
    if (previousMonth < 0) {
        previousMonth = 11;
    }
    const filteredData = ghlData.filter(item => item.dateCreated && new Date(item.dateCreated).getMonth() == new Date().getMonth())
    const comparisonData = ghlData.filter(item => item.dateCreated && new Date(item.dateCreated).getMonth() == previousMonth)
    return (
        <Container size='xl'>
            <Stepper active={-1}>
                <Stepper.Step label="New Leads" icon={<span>5%</span>}/>
                <Stepper.Step label="Supporting Docs Requested"/>
                <Stepper.Step label="Supporting Docs Requested"/>
                <Stepper.Step label="Supporting Docs Requested"/>
            </Stepper>
            <GHLMetricsGrid data={filteredData} comparison={comparisonData} showComparison={true} />
            <GHLEVGrid data={ghlData}/>
        </Container>
    )
}