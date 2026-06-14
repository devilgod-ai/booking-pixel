"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/generated/prisma/client";

interface BookingFormProps {
  plans: Plan[];
  selectedDate: string | null;
  selectedStart: string | null;
  onClose: () => void;
}

function calculateEndTime(start: string, hours: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function BookingForm({
  plans,
  selectedDate,
  selectedStart,
  onClose,
}: BookingFormProps) {
  const [persons, setPersons] = useState(1);
  const [planId, setPlanId] = useState(plans[0]?.id || "");
  const router = useRouter();

  if (!selectedDate || !selectedStart) return null;

  const selectedPlan = plans.find((p) => p.id === planId);
  const endTime = selectedPlan
    ? calculateEndTime(selectedStart, selectedPlan.playHours)
    : selectedStart;

  async function handleConfirm() {
    const response = await fetch(`/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        startTime: selectedStart,
        endTime,
        persons,
        planId,
      }),
    });
    const data = await response.json();
    if (data.id) {
      router.push(`/booking/payment?bookingId=${data.id}`);
    } else {
      alert(data.error || "Booking failed");
    }
  }

  return (
    <div className="w-64 bg-white rounded-lg shadow p-4 space-y-4 shrink-0">
      <h3 className="font-bold text-lg">Booking</h3>
      <p className="text-xs text-gray-500">
        {selectedDate} {selectedStart} - {endTime}
      </p>

      <div>
        <label className="block text-sm mb-1">Persons</label>
        <input
          type="number"
          min={1}
          max={10}
          value={persons}
          onChange={(e) => setPersons(parseInt(e.target.value) || 1)}
          className="w-full border rounded px-2 py-1"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Plan</label>
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="w-full border rounded px-2 py-1"
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (HK${p.price})
            </option>
          ))}
        </select>
      </div>

      {selectedPlan && (
        <div className="text-sm space-y-1 border-t pt-2">
          <p>Amount: HK${selectedPlan.price * persons}</p>
          <p>Deposit: HK${selectedPlan.deposit * persons}</p>
          <p className="font-bold">
            Total: HK${(selectedPlan.price + selectedPlan.deposit) * persons}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 border rounded py-1 text-sm">
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 bg-blue-600 text-white rounded py-1 text-sm"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
