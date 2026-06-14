import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");

  const userId = (session.user as { id?: string }).id!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, phone: true, email: true, totalSpent: true },
  });

  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      plan: { select: { name: true } },
      payment: { select: { status: true, receiptImage: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-semibold mb-2">Profile</h2>
        <p>Name: {user?.name}</p>
        <p>Phone: {user?.phone}</p>
        <p>Email: {user?.email}</p>
        <p className="font-bold mt-2">Total Spent: HK${user?.totalSpent}</p>
      </div>

      <h2 className="text-xl font-bold mb-4">Booking History</h2>
      <div className="space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{b.plan.name}</p>
              <p className="text-sm text-gray-500">{new Date(b.date).toLocaleDateString("zh-HK")} {b.startTime}-{b.endTime}</p>
              <p className="text-sm">{b.persons} person(s) - HK${b.total}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${b.status === "CONFIRMED" ? "bg-green-100 text-green-800" : b.status === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{b.status}</span>
            </div>
            <div className="text-right">
              {b.payment ? (
                <p className="text-xs text-green-600">Receipt uploaded</p>
              ) : (
                <Link href={`/booking/payment?bookingId=${b.id}`} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Upload Receipt</Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
