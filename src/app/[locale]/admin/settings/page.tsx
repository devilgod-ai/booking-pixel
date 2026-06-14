import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function updateMaxSeats(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) return;
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return;

  const seats = parseInt(formData.get("max_seats") as string);
  if (seats > 0) {
    await prisma.setting.upsert({
      where: { key: "max_seats" },
      update: { value: String(seats) },
      create: { key: "max_seats", value: String(seats) },
    });
  }
  revalidatePath("/admin/settings");
}

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") redirect("/zh-HK/booking");

  const setting = await prisma.setting.findUnique({ where: { key: "max_seats" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <form action={updateMaxSeats} className="bg-white p-4 rounded shadow max-w-sm space-y-3">
        <div>
          <label className="block text-sm mb-0.5">Max Seats</label>
          <input name="max_seats" type="number" defaultValue={setting?.value || "10"} min={1} className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
      </form>
    </div>
  );
}
