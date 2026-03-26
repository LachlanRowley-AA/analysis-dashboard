import { Button } from "@mantine/core"
import { mergeGHLIntoMeta } from "@/lib/utils/analytics-merger"
import { GHLData, MetaAdsetData } from "@/types/analytics"
import { useAnalytics } from "./DataStorageContext"
import { cacheData } from "@/lib/cache/redisManager"

export  const TestingButton = () => {
    // const { metaData, ghlData, fullData } = useAnalytics();

    return (
        <Button
            onClick={async () => {
            }}
        >
            Button for testing
        </Button>

    )
}