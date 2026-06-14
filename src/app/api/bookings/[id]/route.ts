import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, phone: true } },
      plan: { select: { name: true, price: true, deposit: true } },
    },
  });

  if (!booking || booking.userId !== (session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
  });

  return NextResponse.json({ booking, paymentMethods });
}
