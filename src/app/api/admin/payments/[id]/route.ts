import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.paymentMethod.delete({ where: { id: params.id } });
  revalidatePath("/admin/payments");
  return NextResponse.json({ success: true });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const method = formData.get("_method") as string;

  if (method === "DELETE") {
    await prisma.paymentMethod.delete({ where: { id: params.id } });
    revalidatePath("/admin/payments");
    return NextResponse.redirect(new URL("/zh-HK/admin/payments", request.url));
  }

  return NextResponse.json({ error: "Bad Request" }, { status: 400 });
}
