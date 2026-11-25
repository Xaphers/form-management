"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EventStat {
  eventId: string;
  eventName: string;
  totalResponses: number;
}

interface StandStat {
  standId: string;
  standName: string;
  eventName: string;
  totalResponses: number;
}

interface AnalyticsData {
  totalUsers: number;
  totalEvents: number;
  totalStands: number;
  totalResponses: number;
  averageRating: number;
  totalRatings: number;
}

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [events, setEvents] = useState<EventStat[]>([]);
  const [stands, setStands] = useState<StandStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      setError("");

      // Cek sesi dan ambil data analytics secara paralel
      const [response] = await Promise.all([
        fetch("/api/backend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "auth.me" }),
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }),
        loadAnalytics(),
      ]);

      const result = await response.json();

      if (
        !response.ok ||
        !result.success ||
        result.user?.role !== "super_admin"
      ) {
        window.location.href = "/";
        return;
      }

      setUser(result.user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memeriksa sesi login."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    setError("");
    setRefreshing(true);

    try {
      const response = await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analytics.get" }),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil data Analytics."
        );
      }

      setStats(result.stats);
      setEvents(result.responsesByEvent || []);
      setStands(result.responsesByStand || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data Analytics."
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/backend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "auth.logout" }),
    });

    window.location.href = "/";
  }

  function getBarWidth(value: number, maximum: number) {
    if (maximum === 0) return "0%";
    return `${Math.max((value / maximum) * 100, 2)}%`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-700 font-semibold">
            Loading Analytics...
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Checking your account and retrieving data.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-6">
          <h2 className="font-bold text-red-700">
            Unable to open Analytics
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            {error || "Session login tidak ditemukan."}
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Events",
      value: stats?.totalEvents ?? 0,
      icon: "📅",
    },
    {
      title: "Total Stands",
      value: stats?.totalStands ?? 0,
      icon: "🏪",
    },
    {
      title: "Total Responses",
      value: stats?.totalResponses ?? 0,
      icon: "💬",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: "👥",
    },
  ];

  const maxEventResponses = Math.max(
    ...events.map((item) => item.totalResponses),
    0
  );

  const maxStandResponses = Math.max(
    ...stands.map((item) => item.totalResponses),
    0
  );

  return (
    <div className="min-h-screen flex items-start bg-[#f5f7fb]">
      <AdminSidebar onLogout={handleLogout} userName={user?.name} />

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 p-6 md:p-10">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-10">
          <div>
            <p className="text-sm text-slate-500">Overview</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">
              Analytics
            </h2>
            <p className="text-slate-500 mt-2">
              Monitor platform performance and participant feedback.
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            disabled={refreshing}
            className="bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-50"
          >
            {refreshing ? "Loading..." : "↻ Refresh Data"}
          </button>
        </header>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            <p className="font-semibold">Analytics Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {statCards.map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">{item.title}</p>
                <span className="text-2xl">{item.icon}</span>
              </div>

              <p className="text-3xl font-bold text-slate-900 mt-5">
                {item.value.toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Average Rating</p>

            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-5xl font-bold text-slate-900">
                {stats?.averageRating ?? 0}
              </h3>
              <span className="text-2xl text-amber-400 mb-1">★</span>
              <span className="text-slate-400 text-sm mb-2">/ 5</span>
            </div>

            <p className="text-sm text-slate-500 mt-3">
              Calculated from {stats?.totalRatings ?? 0} rating answers.
            </p>
          </div>

          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-lg text-slate-900">
              Platform Summary
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Overall number of participants' submissions recorded across
              the platform.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Submissions</p>
                <p className="text-2xl font-bold text-blue-800 mt-2">
                  {(stats?.totalResponses ?? 0).toLocaleString("id-ID")}
                </p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Rating Answers</p>
                <p className="text-2xl font-bold text-amber-700 mt-2">
                  {(stats?.totalRatings ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-lg text-slate-900">
              Responses by Event
            </h3>

            <p className="text-sm text-slate-500 mt-1 mb-6">
              Number of submissions received by each event.
            </p>

            {events.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                No response data available yet.
              </p>
            ) : (
              <div className="space-y-5">
                {events.map((item) => (
                  <div key={item.eventId}>
                    <div className="flex justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {item.eventName}
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {item.totalResponses}
                      </p>
                    </div>

                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: getBarWidth(
                            item.totalResponses,
                            maxEventResponses
                          ),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-lg text-slate-900">
              Responses by Stand
            </h3>

            <p className="text-sm text-slate-500 mt-1 mb-6">
              Number of submissions received by each stand.
            </p>

            {stands.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                No response data available yet.
              </p>
            ) : (
              <div className="space-y-5">
                {stands.map((item) => (
                  <div key={item.standId}>
                    <div className="flex justify-between items-center gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {item.standName}
                        </p>

                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          • {item.eventName}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-800 shrink-0">
                        {item.totalResponses}
                      </p>
                    </div>

                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: getBarWidth(
                            item.totalResponses,
                            maxStandResponses
                          ),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
