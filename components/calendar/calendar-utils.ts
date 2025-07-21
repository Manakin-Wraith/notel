
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const getMonthName = (monthIndex: number) => MONTH_NAMES[monthIndex];

export const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

export const getMonthGrid = (date: Date): { date: Date, isCurrentMonth: boolean }[][] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date, isCurrentMonth: boolean }[] = [];

    // Days from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Days of next month
    const grid_size = 42; // 6 weeks * 7 days
    const nextMonthDays = grid_size - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    // Chunk into weeks
    const weeks: { date: Date, isCurrentMonth: boolean }[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
};

export const getWeekGrid = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay();

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
        week.push(new Date(year, month, day - dayOfWeek + i));
    }
    return week;
};
