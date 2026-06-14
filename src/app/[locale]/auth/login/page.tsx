"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = await signIn("credentials", { login, password, redirect: false });
    if (result?.error) {
      setError("Invalid credentials");
    } else {
      window.location.href = "/zh-HK/booking";
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <form onSubmit={handleCredentials} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email or Phone</label>
          <input value={login} onChange={(e) => setLogin(e.target.value)} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
      </form>

      <div className="mt-4 border-t pt-4">
        <button onClick={() => signIn("google", { callbackUrl: "/zh-HK/booking" })} className="w-full border border-gray-300 py-2 rounded hover:bg-gray-50">
          Login with Google
        </button>
      </div>
    </div>
  );
}
