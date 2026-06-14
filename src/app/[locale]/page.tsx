import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    take: 4,
    orderBy: { price: "asc" },
  });

  return (
    <div className="space-y-12">
      <section className="relative h-64 bg-gray-300 rounded-lg overflow-hidden flex items-center justify-center">
        <p className="text-2xl font-bold text-gray-700">Slide 1</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow p-6 text-center">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-2xl font-bold text-blue-600 my-2">
                HK${plan.price}
              </p>
              <p className="text-sm text-gray-500">{plan.playHours} hour(s)</p>
              <Link
                href="/zh-HK/booking"
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm"
              >
                Book Now
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl mb-2">1</div>
            <h3 className="font-semibold">Choose Plan</h3>
            <p className="text-sm text-gray-500">Pick your preferred plan</p>
          </div>
          <div>
            <div className="text-3xl mb-2">2</div>
            <h3 className="font-semibold">Book Time</h3>
            <p className="text-sm text-gray-500">Select available time slot</p>
          </div>
          <div>
            <div className="text-3xl mb-2">3</div>
            <h3 className="font-semibold">Pay &amp; Play</h3>
            <p className="text-sm text-gray-500">Upload receipt and enjoy</p>
          </div>
        </div>
      </section>
    </div>
  );
}
