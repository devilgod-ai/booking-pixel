"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileUpload } from "@/components/ui/file-upload";
import { useEffect } from "react";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [methodId, setMethodId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!bookingId) { router.push("/zh-HK/booking"); return; }
    fetch(`/api/bookings/${bookingId}`).then(r => r.json()).then(d => {
      if (d.error) router.push("/zh-HK/booking");
      else {
        setData(d);
        setMethodId(d.paymentMethods?.[0]?.id || "");
      }
    });
  }, [bookingId, router]);

  if (!data) return <div className="max-w-2xl mx-auto p-6">Loading...</div>;

  const selectedMethod = data.paymentMethods?.find((m: any) => m.id === methodId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !bookingId) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bookingId", bookingId);
    fd.append("methodId", methodId);
    const res = await fetch("/api/payments", { method: "POST", body: fd });
    if (res.ok) router.push("/zh-HK/account");
    else alert("Upload failed");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payment</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div><h2 className="font-semibold">Member</h2><p>{data.booking?.user?.name}</p><p className="text-sm text-gray-500">{data.booking?.user?.phone}</p></div>
        <div className="border-t pt-4"><h2 className="font-semibold">Booking Details</h2><p>Date: {new Date(data.booking?.date).toLocaleDateString("zh-HK")}</p><p>Time: {data.booking?.startTime} - {data.booking?.endTime}</p><p>Plan: {data.booking?.plan?.name}</p><p>Persons: {data.booking?.persons}</p></div>
        <div className="border-t pt-4"><h2 className="font-semibold">Amount</h2><p>Subtotal: HK${data.booking?.amount}</p><p>Deposit: HK${data.booking?.deposit}</p><p className="font-bold text-lg">Total: HK${data.booking?.total}</p></div>
        <form onSubmit={handleSubmit} className="border-t pt-4 space-y-4">
          <h2 className="font-semibold">Payment Method</h2>
          <div className="space-y-2">
            {data.paymentMethods?.map((m: any) => (
              <label key={m.id} className={`flex items-center gap-3 p-3 border rounded cursor-pointer ${methodId === m.id ? "border-blue-500 bg-blue-50" : ""}`}>
                <input type="radio" name="method" value={m.id} checked={methodId === m.id} onChange={() => setMethodId(m.id)} />
                <span>{m.name}</span>
              </label>
            ))}
          </div>
          {selectedMethod?.qrImage && (
            <div><p className="text-sm text-gray-500 mb-1">Scan QR Code</p><img src={selectedMethod.qrImage} alt={selectedMethod.name} className="w-40 h-40 object-contain border rounded" /></div>
          )}
          <div><label className="block text-sm mb-1">Upload Receipt</label><FileUpload onUpload={setFile} /></div>
          <button type="submit" disabled={!file || uploading} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">{uploading ? "Uploading..." : "Submit Payment"}</button>
        </form>
      </div>
    </div>
  );
}
