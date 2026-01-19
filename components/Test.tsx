"use client"
import { useAnalytics } from "./DataStorageContext"

export default function Test() {
    let metaData = useAnalytics();
    let filtered = metaData.metaData.filter(item => item.adsetName === "Advantage plus").filter(item => item.date.getDay() === 1);

}