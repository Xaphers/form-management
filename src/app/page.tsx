
"use client";

import { useEffect, useState } from "react";

interface Stand {
  standId: string;
  eventId: string;
  eventName: string;
  standName: string;
  registrationStatus: string;
  standStatus: string;
  createdAt: string;
}

export default function StandHolderDashboard() {
  const [name, setName] = useState("");
  const [stands, setStands] = useState<Stand[]>([]);
  const [loading, setLoading] = useState(true);
  const [standsLoading, setStandsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMyStands() {
    setStandsLoading(true);

    try {
      const response = await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stands.my",
        }),
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil data stand.");
      }

      setStands(result.stands || []);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil data stand."
      );
    } finally {
      setStandsLoading(false);
    }
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function checkSession() {
      try {
        // Cek sesi dan ambil data stand secara paralel
        const [response] = await Promise.all([
          fetch("/api/backend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "auth.me" }),
          }),
          loadMyStands(),
        ]);

        const result = await response.json();

        if (!result.success || result.user?.role !== "stand_holder") {
          window.location.href = "/";
          return;
        }

        setName(result.user.name);

        // Perbarui data setiap 60 detik
        interval = setInterval(() => {
          loadMyStands();
        }, 60000);

      } catch {
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    }

    checkSession();

    return () => {
      clearInterval(interval);
    };
  }, []);

  async function logout() {
    try {
      await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auth.logout" }),
      });
    } finally {
      window.location.href = "/";
    }
  }

  function statusStyle(status: string) {
    switch (String(status).toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      case "active":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  const activeCount = stands.filter(
    (stand) => stand.standStatus === "active"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <p className="text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!name) return null;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">

        <header className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Form
            </h1>
            <p className="text-slate-500 text-sm">
              Stand Holder Portal
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </header>

        <section className="mt-12">
          <p className="text-blue-600 font-semibold text-sm">
            STAND HOLDER DASHBOARD
          </p>

          <h2 className="text-3xl font-bold mt-2 text-slate-900">
            Welcome, {name}!
          </h2>

          <p className="text-slate-500 mt-3">
            Manage your registered stands and participant feedback.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
                href="/stand-holder/registration"
                className="rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700"
            >
                Register a Stand
            </a>

            <a
            href="/stand-holder/forms"
            className="rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white hover:bg-slate-800"
            >
            Manage Forms
            </a>


            <a
            href="/stand-holder/responses"
            className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700"
            >
           My Responses
            </a>

</div>
        </section>

        <section className="grid md:grid-cols-3 gap-5 mt-10">
          <div className="bg-white border rounded-2xl p-6">
            <p className="text-slate-500 text-sm">My Stands</p>
            <p className="text-3xl font-bold mt-4 text-slate-900">
              {stands.length}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <p className="text-slate-500 text-sm">Active Stands</p>
            <p className="text-3xl font-bold mt-4 text-green-600">
              {activeCount}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <p className="text-slate-500 text-sm">Total Responses</p>
            <p className="text-3xl font-bold mt-4 text-slate-900">
              —
            </p>
          </div>
        </section>

        <section className="mt-10 bg-white border border-slate-200 rounded-2xl overflow-hidden">

          <div className="p-6 border-b flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                My Registered Stands
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Monitor your stand registration status.
              </p>
            </div>

            <button
              onClick={loadMyStands}
              disabled={standsLoading}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {standsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="m-5 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {stands.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-700">
                No registered stands yet
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Register your first stand to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stands.map((stand) => (
                <div
                  key={stand.standId}
                  className="p-6 flex flex-wrap justify-between items-center gap-4"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {stand.standName}
                    </h4>

                    <p className="text-sm text-slate-500 mt-1">
                      {stand.eventName}
                    </p>

                    <p className="text-xs text-slate-400 mt-2">
                      {stand.standId}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(stand.registrationStatus)}`}
                    >
                      {stand.registrationStatus}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(stand.standStatus)}`}
                    >
                      {stand.standStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-6 py-3 bg-slate-50 border-t">
            <p className="text-xs text-slate-400">
              Stand status is automatically refreshed every 60 seconds.
            </p>
          </div>

        </section>
      </div>
    </main>
  );
}
