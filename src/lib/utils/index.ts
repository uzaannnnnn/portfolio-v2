import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatMonthYear(month: number | null, year: number | null): string {
  if (!year) return "";
  if (!month || month < 1 || month > 12) return String(year);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatPeriodRange(params: {
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isCurrent: boolean;
}): string {
  const start = formatMonthYear(params.startMonth, params.startYear);
  if (params.isCurrent) {
    return `${start} — Present`;
  }
  const end = formatMonthYear(params.endMonth, params.endYear);
  return end ? `${start} — ${end}` : start;
}
