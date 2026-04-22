import { Stack, Grid, Title, Select } from '@mantine/core';
import { OrganicMetricsGrid } from '../OrganicMetricsGrid';
import { useMetaData } from '@/app/context/MetaContextProvider';
import { mergeAdsetData } from '@/utils/calculateUtils';

export const OrganicTab = () => {
    const data = useMetaData().data;
    if (!data) return <p>No data available</p>;
    const workingData = data.filter(item => item.adsetName === 'Organic');
    const previousMonth = new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1;
    const currentMonth = new Date().getMonth();
    const previousMonthData = workingData.filter(item => item.date.getMonth() === previousMonth);
    const currentMonthData = workingData.filter(item => item.date.getMonth() === currentMonth);
    const merge = mergeAdsetData(workingData, 'Organic');
    const previousMonthMerge = mergeAdsetData(previousMonthData, 'Previous Month Organic');
    const currentMonthMerge = mergeAdsetData(currentMonthData, 'Current Month Organic');

    // console.log('organic data = ', workingData)
    return (
        <Stack gap="xl">
            <div>
                <Title order={2} mb="md" c='white'>Organic Data</Title>
                <OrganicMetricsGrid data={currentMonthMerge} dataArr={currentMonthData} comparison={previousMonthMerge} comparisonArr={previousMonthData} />
            </div>
        </Stack>
    );
};