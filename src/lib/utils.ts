import { prisma } from "@/lib/prisma";

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function bookingsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && start2 < end1;
}

export async function getRemainingSeats(
  date: Date,
  startTime: string,
  endTime: string
): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: "max_seats" },
  });
  const maxSeats = setting ? parseInt(setting.value) : 10;

  const dateStr = date.toISOString().split("T")[0];

  const confirmedBookings = await prisma.booking.count({
    where: {
      date: new Date(dateStr),
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  return maxSeats - confirmedBookings;
}
