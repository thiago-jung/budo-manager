"use client";
import Navbar from "./Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className="flex-1 p-8 bg-neutral overflow-auto">{children}</main>
    </div>
  );
}
