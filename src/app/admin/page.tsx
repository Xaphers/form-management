
"use client";

import { useEffect, useState } from "react";

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
        const response = await fetch("/api/backend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "auth.me" }),
        });

        const result = await response.json();

        if (!result.success || result.user?.role !== "super_admin") {
          window.location.href = "/";
          return;
        }

        setUser(result.user);

        const analyticsResponse = await fetch("/api/backend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "analytics.get" }),
        });

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

      {/* SIDEBAR */}
      <aside className="w-64 h-screen shrink-0 bg-[#142b50] text-white flex flex-col overflow-hidden">

        {/* LOGO */}
        <div className="shrink-0 p-6">
          <h1 className="text-xl font-bold">
            <span className="text-blue-400">Form</span>
          </h1>
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">

          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-300">
            Main Menu
          </p>

          <nav className="space-y-2">

            <a
              href="/admin"
              className="flex items-center gap-3 rounded-lg bg-blue-500/20 px-4 py-3 text-sm font-semibold text-white"
            >
              <span>▦</span>
              Dashboard
            </a>

            <a
              href="/admin/events"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-blue-100/70 transition hover:bg-blue-500/20 hover:text-white"
            >
              <span>📅</span>
              Events
            </a>

            <a
              href="/admin/stands"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-blue-100/70 transition hover:bg-blue-500/20 hover:text-white"
            >
              <span>🏪</span>
              Stand Registrations
            </a>

            <a
              href="/admin/responses"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-blue-100/70 transition hover:bg-blue-500/20 hover:text-white"
            >
              <span>💬</span>
              Responses
            </a>

            <a
              href="/admin/analytics"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-blue-100/70 transition hover:bg-blue-500/20 hover:text-white"
            >
              <span>📊</span>
              Analytics
            </a>

            <a
              href="/admin/users"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-blue-100/70 transition hover:bg-blue-500/20 hover:text-white"
            >
              <span>👥</span>
              Users
            </a>

          </nav>
        </div>

        {/* ACCOUNT & SIGN OUT */}
        <div className="shrink-0 border-t border-white/10 bg-[#142b50] p-6">

          <p className="truncate text-sm font-semibold">
            {user.name}
          </p>

          <p className="mt-1 text-xs text-blue-200">
            Super Admin
          </p>

          <button
            onClick={handleLogout}
            className="mt-5 w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
          >
            ↪ Sign Out
          </button>

        </div>
      </aside>

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
