import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Role, AvailableDays, LeaveDay } from "../src/generated/prisma/enums";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@booking.hk" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@booking.hk",
      phone: "99999999",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: "sales@booking.hk" },
    update: {},
    create: {
      name: "Sales",
      email: "sales@booking.hk",
      phone: "88888888",
      passwordHash,
      role: Role.SALES,
    },
  });

  const plans = [
    {
      name: "1 Hour",
      playHours: 1,
      availableDays: AvailableDays.ANY,
      timeStart: "00:00",
      timeEnd: "23:59",
      earliestEntry: "00:00",
      latestLeave: "23:59",
      latestLeaveDay: LeaveDay.SAME,
      price: 100,
      deposit: 50,
      overtimeRate: 80,
    },
    {
      name: "2 Hours",
      playHours: 2,
      availableDays: AvailableDays.ANY,
      timeStart: "00:00",
      timeEnd: "23:59",
      earliestEntry: "00:00",
      latestLeave: "23:59",
      latestLeaveDay: LeaveDay.SAME,
      price: 180,
      deposit: 50,
      overtimeRate: 80,
    },
    {
      name: "3 Hours",
      playHours: 3,
      availableDays: AvailableDays.ANY,
      timeStart: "00:00",
      timeEnd: "23:59",
      earliestEntry: "00:00",
      latestLeave: "23:59",
      latestLeaveDay: LeaveDay.SAME,
      price: 250,
      deposit: 50,
      overtimeRate: 80,
    },
    {
      name: "4 Hours",
      playHours: 4,
      availableDays: AvailableDays.ANY,
      timeStart: "00:00",
      timeEnd: "23:59",
      earliestEntry: "00:00",
      latestLeave: "23:59",
      latestLeaveDay: LeaveDay.SAME,
      price: 300,
      deposit: 50,
      overtimeRate: 80,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.create({ data: plan });
  }

  await prisma.paymentMethod.upsert({
    where: { id: "payme-seed" },
    update: {},
    create: {
      id: "payme-seed",
      name: "PayMe",
      qrImage: "/uploads/payme-placeholder.png",
    },
  });

  await prisma.paymentMethod.upsert({
    where: { id: "fps-seed" },
    update: {},
    create: {
      id: "fps-seed",
      name: "FPS 轉數快",
      qrImage: "/uploads/fps-placeholder.png",
    },
  });

  await prisma.setting.upsert({
    where: { key: "max_seats" },
    update: {},
    create: { key: "max_seats", value: "10" },
  });

  console.log("Seed complete: admin + sales users, 4 plans, 2 payment methods, 1 setting");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
