import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getRemainingSeats } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { date, startTime, endTime, persons, planId } = body;

  if (!date || !startTime || !endTime || !persons || !planId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 400 });
  }

  const remaining = await getRemainingSeats(
    new Date(date),
    startTime,
    endTime
  );

  if (remaining < persons) {
    return NextResponse.json(
      { error: "Not enough seats remaining" },
      { status: 400 }
    );
  }

  const userId = (session.user as { id?: string }).id!;

  const booking = await prisma.booking.create({
    data: {
      userId,
      planId,
      date: new Date(date),
      startTime,
      endTime,
      persons,
      amount: plan.price * persons,
      deposit: plan.deposit * persons,
      total: (plan.price + plan.deposit) * persons,
    },
  });

  return NextResponse.json(booking);
}
