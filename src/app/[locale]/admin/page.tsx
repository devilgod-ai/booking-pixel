import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SALES") redirect("/zh-HK/booking");

  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { name: true, phone: true } },
      plan: { select: { name: true } },
      payment: { select: { status: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Booking Overview</h1>
      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">Member</th>
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-left">Plan</th>
            <th className="p-2 text-left">Persons</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Payment</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-t">
              <td className="p-2">{new Date(b.date).toLocaleDateString("zh-HK")}</td>
              <td className="p-2">{b.startTime}-{b.endTime}</td>
              <td className="p-2">{b.user.name}</td>
              <td className="p-2">{b.user.phone}</td>
              <td className="p-2">{b.plan?.name}</td>
              <td className="p-2">{b.persons}</td>
              <td className="p-2">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  b.status === "CONFIRMED" ? "bg-green-100 text-green-800"
                  : b.status === "CANCELLED" ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
                }`}>{b.status}</span>
              </td>
              <td className="p-2">{b.payment?.status || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
