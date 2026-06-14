"use client";

import { useState } from "react";
import { TimeSlot } from "./time-slot";
import { BookingForm } from "./booking-form";
import type { Plan, Booking, User } from "@/generated/prisma/client";

type BookingWithUser = Booking & { user: Pick<User, "name" | "phone"> };

interface CalendarGridProps {
  initialBookings: BookingWithUser[];
  plans: Plan[];
  userRole?: string;
  userId?: string;
  locale: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CalendarGrid({
  initialBookings,
  plans,
  userRole,
  userId,
  locale,
}: CalendarGridProps) {
  const [offset, setOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);

  const daysToShow = 7;

  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset + i);
    days.push(d);
  }

  function formatDay(d: Date) {
    return d.toISOString().split("T")[0];
  }

  function handleSlotClick(date: string, startTime: string) {
    setSelectedDate(date);
    setSelectedStart(startTime);
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1 overflow-x-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 7))}
            className="px-3 py-1 border rounded disabled:opacity-30"
          >
            &lt;
          </button>
          <span className="text-sm font-medium">
            {formatDay(days[0])} - {formatDay(days[6])}
          </span>
          <button
            onClick={() => setOffset((o) => o + 7)}
            className="px-3 py-1 border rounded"
          >
            &gt;
          </button>
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}
        >
          <div className="border-b p-1 text-xs font-medium">Time</div>
          {days.map((d) => (
            <div
              key={formatDay(d)}
              className="border-b p-1 text-xs font-medium text-center"
            >
              {d.toLocaleDateString(locale, { weekday: "short" })}
              <br />
              {d.getDate()}/{d.getMonth() + 1}
            </div>
          ))}

          {HOURS.map((hour) => (
            <TimeSlot
              key={hour}
              hour={hour}
              days={days}
              bookings={initialBookings.filter((b) => {
                const bStart = parseInt(b.startTime.split(":")[0]);
                const bEnd = parseInt(b.endTime.split(":")[0]);
                return hour >= bStart && hour < bEnd;
              })}
              userRole={userRole}
              userId={userId}
              onSlotClick={handleSlotClick}
            />
          ))}
        </div>
      </div>

      <BookingForm
        plans={plans}
        selectedDate={selectedDate}
        selectedStart={selectedStart}
        onClose={() => {
          setSelectedDate(null);
          setSelectedStart(null);
        }}
      />
    </div>
  );
}
