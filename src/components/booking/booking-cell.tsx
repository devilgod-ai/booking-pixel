"use client";

import type { User, Booking } from "@/generated/prisma/client";

type BookingWithUser = Booking & { user: Pick<User, "name" | "phone"> };

interface BookingCellProps {
  booking: BookingWithUser;
  userRole: string;
  userId: string;
  slotHour: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-400",
  CONFIRMED: "bg-green-500",
  CANCELLED: "bg-red-300",
};

export function BookingCell({
  booking,
  userRole,
  userId,
  slotHour,
}: BookingCellProps) {
  const isOwner = booking.userId === userId;
  const isAdmin = userRole === "ADMIN" || userRole === "SALES";
  const canSeeDetails = isOwner || isAdmin;

  const startMinutes =
    parseInt(booking.startTime.split(":")[0]) * 60 +
    parseInt(booking.startTime.split(":")[1]);
  const endMinutes =
    parseInt(booking.endTime.split(":")[0]) * 60 +
    parseInt(booking.endTime.split(":")[1]);

  const slotStart = slotHour * 60;
  const slotEnd = slotStart + 60;

  const visibleStart = Math.max(startMinutes, slotStart);
  const visibleEnd = Math.min(endMinutes, slotEnd);
  const visibleRatio = (visibleEnd - visibleStart) / 60;
  const topPercent = ((visibleStart - slotStart) / 60) * 100;

  const color = isOwner
    ? "bg-gray-400"
    : isAdmin
      ? STATUS_COLORS[booking.status] || "bg-gray-300"
      : "bg-gray-400";

  return (
    <div
      className={`absolute left-0 right-0 ${color} rounded text-xs overflow-hidden z-10`}
      style={{
        top: `${topPercent}%`,
        height: `${visibleRatio * 100}%`,
      }}
      title={canSeeDetails ? `${booking.user.name} ${booking.user.phone || ""}` : undefined}
    >
      {canSeeDetails && (
        <span className="p-0.5 block truncate text-white">
          {booking.user.name}
          {isAdmin && booking.user.phone && (
            <span className="opacity-75"> {booking.user.phone}</span>
          )}
        </span>
      )}
      {!canSeeDetails && <div className="w-full h-full" />}
    </div>
  );
}
