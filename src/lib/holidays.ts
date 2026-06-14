import { prisma } from "@/lib/prisma";

interface GovHoliday {
  date: string;
  name: string;
}

export async function fetchHKHolidays(): Promise<GovHoliday[]> {
  const response = await fetch(
    "https://data.gov.hk/api/3/action/package_show?id=2026-hong-kong-holiday",
    { next: { revalidate: 86400 } }
  );

  if (!response.ok) {
    console.error("Failed to fetch HK holidays");
    return [];
  }

  const data = await response.json();
  const records = data?.result?.records || [];

  return records.map((r: { date: string; nameEN: string }) => ({
    date: r.date,
    name: r.nameEN || r.date,
  }));
}

export async function isHolidayOrWeekend(date: Date): Promise<boolean> {
  const day = date.getDay();
  if (day === 0 || day === 6) return true;

  const dateStr = date.toISOString().split("T")[0];
  const holiday = await prisma.holiday.findUnique({
    where: { date: new Date(dateStr) },
  });

  return !!holiday;
}

export async function isPlanAvailableOnDate(
  plan: { availableDays: string },
  date: Date
): Promise<boolean> {
  if (plan.availableDays === "ANY") return true;

  const isHoliday = await isHolidayOrWeekend(date);

  if (plan.availableDays === "WEEKDAY_NO_HOLIDAY") {
    return !isHoliday;
  }

  if (plan.availableDays === "WEEKDAY") {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  }

  return true;
}
