import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CalendarGrid } from "@/components/booking/calendar-grid";
import { redirect } from "next/navigation";

export default async function BookingPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      user: { select: { name: true, phone: true } },
    },
  });

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
  });

  const userRole = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Booking</h1>
      <CalendarGrid
        initialBookings={bookings}
        plans={plans}
        userRole={userRole}
        userId={userId}
        locale="zh-HK"
      />
    </div>
  );
}
