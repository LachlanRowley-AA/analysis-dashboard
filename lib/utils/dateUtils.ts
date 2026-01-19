export const getDateBoundaries = () => {
  const now = new Date();
  
  return {
    startOfThisMonth: new Date(now.getFullYear(), now.getMonth(), 1),
    startOfLastMonth: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    startOfNextMonth: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
};

export const getWeekStart = (date: Date): string => {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
