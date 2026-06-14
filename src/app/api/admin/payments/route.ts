import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const qrImage = (formData.get("qrImage") as string) || "/uploads/default.png";

  await prisma.paymentMethod.create({ data: { name, qrImage } });
  revalidatePath("/admin/payments");
  return NextResponse.redirect(new URL("/zh-HK/admin/payments", request.url));
}
