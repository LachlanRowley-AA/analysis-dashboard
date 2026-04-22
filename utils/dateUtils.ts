// import { startOfMonthInSydney, startOfMonthOffsetInSydney, inSydney, formatDateInAEDT } from "./aedt";

// /** Date boundaries in Australia/Sydney (AEDT). */
// export const getDateBoundaries = () => {
//   return {
//     startOfThisMonth: startOfMonthInSydney(new Date()),
//     startOfLastMonth: startOfMonthOffsetInSydney(-1),
//     startOfNextMonth: startOfMonthOffsetInSydney(1),
//   };
// };

// export const getWeekStart = (date: Date): string => {
//   const d = inSydney(date);
//   const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
//   return weekStart.toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", month: "short", day: "numeric" });
// };

// /** Format date as YYYY-MM-DD in Australia/Sydney (for Meta API and display). */
// export const formatDateLocal = (date: Date) => formatDateInAEDT(date);