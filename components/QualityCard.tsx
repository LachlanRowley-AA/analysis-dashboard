import { StatCard } from "@/components/StatCard";
import { useMetaData } from "@/app/context/MetaContextProvider";

export default function QualityCard() {
    const { ghlData } = useMetaData();
    const qualifiedStageIds = [
        '2035afd1-3186-446e-94db-17db3c5115fd',
        '07985b6b-7d89-4ca8-a53f-0e87ef036c55',
        'd1c8e5b7-9a0c-4f1b-9c3e-2a1e5f8b6c3a',
        '3f6932c8-c391-4a13-ab7d-8efe4b29823e',
    ]
    const notQualifiedStageId = 'f2863216-01c1-491c-919e-7723e3aa4d56';

    const qualifiedCount = ghlData
        ? ghlData.filter(item => qualifiedStageIds.includes(item.stageId)).length
        : 0;
    const notQualifiedCount = ghlData ? ghlData.filter(item => item.stageId === notQualifiedStageId).length
        : 0;

    return (
        <StatCard
            title="Qualified Lead Rate"
            value={ghlData && ghlData.length > 0 ? `${((qualifiedCount / (qualifiedCount + notQualifiedCount)) * 100).toFixed(2)}%` : "0%"}
            icon="check"
            color="#20c997"
        />
    )
}