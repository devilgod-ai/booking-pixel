"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function register(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !phone || !email || !password) {
    return { error: "All fields required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });

  if (existing) {
    return { error: "Email or phone already registered" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, phone, email, passwordHash },
  });

  return { success: true };
}
