import { BarChart } from "@mantine/charts";
import { GHLData } from "@/types/analytics";
import { GHL_STAFF_IDS } from "@/lib/constants/ghl";

interface OwnershipChartProps {
    data: GHLData[]
}
export function OwnershipChart({ data }: OwnershipChartProps) {
    const ownershipCount = new Map<string, number>();

    data.forEach((item) => {
        if (item.owner) {
            ownershipCount.set(
                item.owner,
                (ownershipCount.get(item.owner) ?? 0) + 1
            );
        }
    });

    const chartData = Array.from(ownershipCount, ([owner, count]) => ({
        owner: GHL_STAFF_IDS[owner] ?? owner, // fallback just in case
        count,
    }));

    return (
        <BarChart
            data={chartData}
            dataKey="owner"
            series={[{ name: "count" }]}
            h="100px"
        />
    );
}
