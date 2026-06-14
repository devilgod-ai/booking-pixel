import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PlanForm } from "@/components/admin/plan-form";

export default async function AdminPlansPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") redirect("/zh-HK/booking");

  const plans = await prisma.plan.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Plans</h1>
      <div className="mb-6">
        <details>
          <summary className="cursor-pointer text-blue-600 mb-2">+ New Plan</summary>
          <PlanForm plan={null} />
        </details>
      </div>
      {plans.map((plan) => (
        <details key={plan.id} className="mb-3">
          <summary className="cursor-pointer font-medium">
            {plan.name} - HK${plan.price} ({plan.playHours}h)
          </summary>
          <PlanForm plan={plan} />
        </details>
      ))}
    </div>
  );
}
