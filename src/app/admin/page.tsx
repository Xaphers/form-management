
"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardStats {
  totalEvents: number;
  totalStands: number;
  totalResponses: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        // Jalankan cek sesi dan ambil data secara paralel
        const [response, analyticsResponse] = await Promise.all([
          fetch("/api/backend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "auth.me" }),
          }),
          fetch("/api/backend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "analytics.get" }),
          }),
        ]);

        const result = await response.json();

        if (!result.success || result.user?.role !== "super_admin") {
          window.location.href = "/";
          return;
        }

        setUser(result.user);

        const analyticsResult = await analyticsResponse.json();

        if (analyticsResult.success) {
          setStats(analyticsResult.stats);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auth.logout" }),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  const statsItems = [
    {
      title: "Total Events",
      value: stats?.totalEvents ?? 0,
      icon: "📅",
      description: "Events created",
    },
    {
      title: "Total Stands",
      value: stats?.totalStands ?? 0,
      icon: "🏪",
      description: "Registered stands",
    },
    {
      title: "Total Responses",
      value: stats?.totalResponses ?? 0,
      icon: "💬",
      description: "Participant submissions",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: "👥",
      description: "Registered accounts",
    },
  ];

  const quickActions = [
    {
      title: "Manage Events",
      description: "Create and manage your events.",
      icon: "📅",
      path: "/admin/events",
    },
    {
      title: "Manage Stands",
      description: "Review and manage stand registrations.",
      icon: "🏪",
      path: "/admin/stands",
    },
    {
      title: "View Responses",
      description: "See feedback submitted by participants.",
      icon: "💬",
      path: "/admin/responses",
    },
    {
      title: "View Analytics",
      description: "Monitor platform statistics and performance.",
      icon: "📊",
      path: "/admin/analytics",
    },
    {
      title: "Manage Users",
      description: "View and manage registered accounts.",
      icon: "👥",
      path: "/admin/users",
    },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-[#f5f7fb]">

      <AdminSidebar onLogout={handleLogout} userName={user?.name} />

      {/* MAIN CONTENT */}
      <main className="h-screen min-w-0 flex-1 overflow-y-auto p-6 md:p-10">

        {/* HEADER */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">

          <div>
            <p className="text-sm text-slate-500">
              Overview
            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              Dashboard
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-400">
              Signed in as
            </p>

            <p className="text-sm font-semibold text-slate-800">
              {user.name}
            </p>
          </div>

        </header>

        {/* WELCOME */}
        <section className="mb-8">

          <h3 className="text-xl font-bold text-slate-900">
            Welcome back, {user.name}!
          </h3>

          <p className="mt-2 text-slate-500">
            Here's an overview of your Form platform.
          </p>

        </section>

        {/* STATISTICS */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {statsItems.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {item.title}
                </p>

                <span className="text-2xl">
                  {item.icon}
                </span>
              </div>

              <p className="mt-5 text-3xl font-bold text-slate-900">
                {item.value}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {item.description}
              </p>

            </div>
          ))}

        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-10">

          <div className="mb-5">
            <h3 className="text-xl font-bold text-slate-900">
              Quick Actions
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Quickly access the main platform features.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

            {quickActions.map((item) => (
              <button
                key={item.path}
                onClick={() => (window.location.href = item.path)}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >

                <span className="text-3xl">
                  {item.icon}
                </span>

                <h4 className="mt-4 font-bold text-slate-900">
                  {item.title}
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  {item.description}
                </p>

                <p className="mt-5 text-sm font-semibold text-blue-700">
                  Open page →
                </p>

              </button>
            ))}

          </div>

        </section>

      </main>
    </div>
  );
}
