"use client";

import type { PlanModel } from "@/generated/prisma/models/Plan";

interface PlanFormProps {
  plan?: PlanModel | null;
}

export function PlanForm({ plan }: PlanFormProps) {
  return (
    <form method="POST" action="/api/admin/plans" className="space-y-3 bg-white p-4 rounded shadow">
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <div>
        <label className="block text-sm mb-0.5">Name</label>
        <input name="name" defaultValue={plan?.name} required className="w-full border rounded px-3 py-1.5" />
      </div>
      <div>
        <label className="block text-sm mb-0.5">Hours</label>
        <input name="playHours" type="number" defaultValue={plan?.playHours} required className="w-full border rounded px-3 py-1.5" />
      </div>
      <div>
        <label className="block text-sm mb-0.5">Available Days</label>
        <select name="availableDays" defaultValue={plan?.availableDays || "ANY"} className="w-full border rounded px-3 py-1.5">
          <option value="WEEKDAY">Mon-Fri</option>
          <option value="WEEKDAY_NO_HOLIDAY">Mon-Fri (No Holidays)</option>
          <option value="ANY">Any Day</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm mb-0.5">Time From</label>
          <input name="timeStart" type="time" defaultValue={plan?.timeStart} className="w-full border rounded px-3 py-1.5" />
        </div>
        <div>
          <label className="block text-sm mb-0.5">Time To</label>
          <input name="timeEnd" type="time" defaultValue={plan?.timeEnd} className="w-full border rounded px-3 py-1.5" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm mb-0.5">Earliest Entry</label>
          <input name="earliestEntry" type="time" defaultValue={plan?.earliestEntry} className="w-full border rounded px-3 py-1.5" />
        </div>
        <div>
          <label className="block text-sm mb-0.5">Latest Leave</label>
          <input name="latestLeave" type="time" defaultValue={plan?.latestLeave} className="w-full border rounded px-3 py-1.5" />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-0.5">Leave Day</label>
        <select name="latestLeaveDay" defaultValue={plan?.latestLeaveDay || "SAME"} className="w-full border rounded px-3 py-1.5">
          <option value="SAME">Same Day</option>
          <option value="NEXT">Next Day</option>
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-sm mb-0.5">Price (HK$)</label>
          <input name="price" type="number" step="0.01" defaultValue={plan?.price} className="w-full border rounded px-3 py-1.5" />
        </div>
        <div>
          <label className="block text-sm mb-0.5">Deposit (HK$)</label>
          <input name="deposit" type="number" step="0.01" defaultValue={plan?.deposit} className="w-full border rounded px-3 py-1.5" />
        </div>
        <div>
          <label className="block text-sm mb-0.5">Overtime/hr (HK$)</label>
          <input name="overtimeRate" type="number" step="0.01" defaultValue={plan?.overtimeRate} className="w-full border rounded px-3 py-1.5" />
        </div>
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        {plan ? "Update" : "Create"} Plan
      </button>
    </form>
  );
}
