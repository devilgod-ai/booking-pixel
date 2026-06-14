import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { AvailableDays, LeaveDay } from "@/generated/prisma/enums";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const id = formData.get("id") as string | null;

  const data = {
    name: formData.get("name") as string,
    playHours: parseInt(formData.get("playHours") as string),
    availableDays: formData.get("availableDays") as AvailableDays,
    timeStart: formData.get("timeStart") as string,
    timeEnd: formData.get("timeEnd") as string,
    earliestEntry: formData.get("earliestEntry") as string,
    latestLeave: formData.get("latestLeave") as string,
    latestLeaveDay: formData.get("latestLeaveDay") as LeaveDay,
    price: parseFloat(formData.get("price") as string),
    deposit: parseFloat(formData.get("deposit") as string),
    overtimeRate: parseFloat(formData.get("overtimeRate") as string),
  };

  if (id) {
    await prisma.plan.update({ where: { id }, data });
  } else {
    await prisma.plan.create({ data });
  }

  revalidatePath("/admin/plans");
  return NextResponse.redirect(new URL("/zh-HK/admin/plans", request.url));
}
