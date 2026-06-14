"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/zh-HK" className="text-xl font-bold">
          Booking
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/zh-HK">Home</Link>
          {session ? (
            <>
              <Link href="/zh-HK/booking">Booking</Link>
              <Link href="/zh-HK/account">My Account</Link>
              {((session.user as { role?: string }).role === "ADMIN" ||
                (session.user as { role?: string }).role === "SALES") && (
                <Link href="/zh-HK/admin">Admin</Link>
              )}
              <button onClick={() => signOut()} className="text-red-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/zh-HK/auth/login">Login</Link>
              <Link href="/zh-HK/auth/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
