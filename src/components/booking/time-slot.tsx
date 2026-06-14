"use client";

import { BookingCell } from "./booking-cell";
import type { User, Booking } from "@/generated/prisma/client";

type BookingWithUser = Booking & { user: Pick<User, "name" | "phone"> };

interface TimeSlotProps {
  hour: number;
  days: Date[];
  bookings: BookingWithUser[];
  userRole?: string;
  userId?: string;
  onSlotClick: (date: string, startTime: string) => void;
}

export function TimeSlot({
  hour,
  days,
  bookings,
  userRole,
  userId,
  onSlotClick,
}: TimeSlotProps) {
  const formatHour = `${String(hour).padStart(2, "0")}:00`;

  return (
    <>
      <div className="border-r border-b p-1 text-xs text-gray-500 h-14 flex items-center">
        {formatHour}
      </div>
      {days.map((d) => {
        const dateStr = d.toISOString().split("T")[0];
        const cellBookings = bookings.filter((b) => {
          const bDate = new Date(b.date).toISOString().split("T")[0];
          return bDate === dateStr;
        });

        return (
          <div
            key={dateStr}
            className="border-r border-b h-14 relative cursor-pointer hover:bg-blue-50"
            onClick={() => onSlotClick(dateStr, formatHour)}
          >
            {cellBookings.map((b) => (
              <BookingCell
                key={b.id}
                booking={b}
                userRole={userRole || ""}
                userId={userId || ""}
                slotHour={hour}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}
