import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const bookingId = formData.get("bookingId") as string;
  const methodId = formData.get("methodId") as string;

  if (!file || !bookingId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== (session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop();
  const filename = `receipt-${bookingId}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), new Uint8Array(buffer));

  await prisma.payment.create({
    data: {
      bookingId,
      methodId: methodId || null,
      receiptImage: `/uploads/${filename}`,
      uploadedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
