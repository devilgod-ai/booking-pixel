import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") redirect("/zh-HK/booking");

  const methods = await prisma.paymentMethod.findMany();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Payment Methods</h1>
      <form action="/api/admin/payments" method="POST" className="bg-white p-4 rounded shadow mb-6 space-y-3">
        <input name="name" placeholder="Payment name" required className="w-full border rounded px-3 py-2" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
      </form>
      {methods.map((m) => (
        <div key={m.id} className="bg-white p-3 rounded shadow mb-2 flex items-center justify-between">
          <div>
            <span className="font-medium">{m.name}</span>
            {m.qrImage && <img src={m.qrImage} alt={m.name} className="w-12 h-12 object-contain ml-2 inline" />}
          </div>
          <form action={`/api/admin/payments/${m.id}`} method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <button type="submit" className="text-red-600 text-sm">Delete</button>
          </form>
        </div>
      ))}
    </div>
  );
}
