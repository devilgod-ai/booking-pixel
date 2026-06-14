import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SALES") redirect("/zh-HK/booking");

  const users = await prisma.user.findMany({
    include: { bookings: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Joined</th>
            <th className="p-2 text-left">Bookings</th>
            <th className="p-2 text-left">Spent</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.name}</td>
              <td className="p-2">
                <span className={`px-2 py-0.5 rounded text-xs ${u.role === "ADMIN" ? "bg-purple-100" : u.role === "VIP" ? "bg-yellow-100" : u.role === "SALES" ? "bg-blue-100" : "bg-gray-100"}`}>{u.role}</span>
              </td>
              <td className="p-2">{u.phone}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.createdAt.toLocaleDateString("zh-HK")}</td>
              <td className="p-2">{u.bookings.length}</td>
              <td className="p-2">HK${u.totalSpent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
