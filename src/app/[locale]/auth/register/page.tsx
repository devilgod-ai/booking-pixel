"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "./actions";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await register(formData);
    if (result.error) {
      setError(result.error);
    } else {
      router.push("/zh-HK/auth/login");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="name" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">WhatsApp</label>
          <input name="phone" type="tel" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input name="password" type="password" required minLength={6} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input name="confirmPassword" type="password" required minLength={6} className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Register
        </button>
      </form>
    </div>
  );
}
