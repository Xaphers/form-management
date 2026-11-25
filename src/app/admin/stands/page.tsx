
"use client";

import { useEffect, useState } from "react";

interface StandItem {
  standId: string;
  eventId: string;
  eventName: string;
  standName: string;
  ownerUserId: string;
  ownerName: string;
  ownerEmail: string;
  registrationStatus: string;
  standStatus: string;
  createdAt: string;
}

export default function AdminStandsPage() {
  const [stands, setStands] = useState<StandItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function api(action: string, data = {}) {
    const response = await fetch("/api/backend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Permintaan gagal.");
    }

    return result;
  }

  async function loadStands() {
    setLoading(true);
    setError("");

    try {
      const result = await api("stands.list");
      setStands(result.stands || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data stand."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyFormLink(standId: string) {
    const formLink =
      `${window.location.origin}/review/${encodeURIComponent(standId)}`;

    try {
      await navigator.clipboard.writeText(formLink);
      setMessage("Public form link berhasil disalin: " + formLink);
      setError("");
    } catch {
      setError("Gagal menyalin link. Silakan salin manual: " + formLink);
    }
  }

  useEffect(() => {
    loadStands();
  }, []);

  async function updateStatus(
    standId: string,
    registrationStatus: string,
    standStatus: string
  ) {
    let confirmation = "";

    if (
      registrationStatus === "approved" &&
      standStatus === "inactive"
    ) {
      const currentStand = stands.find(
        (stand) => stand.standId === standId
      );

      if (currentStand?.registrationStatus === "pending") {
        confirmation = "Setujui pendaftaran stand ini?";
      } else {
        confirmation = "Nonaktifkan stand ini?";
      }
    } else if (registrationStatus === "rejected") {
      confirmation = "Tolak pendaftaran stand ini?";
    } else if (standStatus === "active") {
      confirmation = "Aktifkan stand ini?";
    }

    if (!confirmation) return;
    if (!window.confirm(confirmation)) return;

    setUpdatingId(standId);
    setError("");
    setMessage("");

    try {
      const result = await api("stands.update", {
        standId,
        registrationStatus,
        standStatus,
      });

      setMessage(result.message || "Status berhasil diperbarui.");
      await loadStands();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui status."
      );
    } finally {
      setUpdatingId("");
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

  function statusStyle(status: string) {
    if (status === "approved") {
      return "bg-green-100 text-green-700";
    }

    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  const filteredStands =
    filter === "all"
      ? stands
      : stands.filter(
          (stand) => stand.registrationStatus === filter
        );

  const pendingCount = stands.filter(
    (stand) => stand.registrationStatus === "pending"
  ).length;

  const approvedCount = stands.filter(
    (stand) => stand.registrationStatus === "approved"
  ).length;

  const rejectedCount = stands.filter(
    (stand) => stand.registrationStatus === "rejected"
  ).length;

  return (
    <div className="h-screen flex overflow-hidden bg-[#f5f7fb]">

      {/* SIDEBAR */}
      <aside className="w-64 h-screen shrink-0 bg-[#142b50] text-white flex flex-col overflow-hidden">

        {/* LOGO */}
        <div className="p-6 shrink-0">
          <h1 className="text-xl font-bold">
            NFC<span className="text-blue-400">.</span>REVIEW
          </h1>
        </div>

        {/* MENU - SCROLLABLE */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">

          <p className="text-xs text-blue-300 uppercase tracking-widest mb-4">
            Main Menu
          </p>

          <nav className="space-y-2">

            <button
              onClick={() => (window.location.href = "/admin")}
              className="w-full text-left px-4 py-3 rounded-lg text-blue-100/70 hover:bg-blue-500/20 hover:text-white transition"
            >
              Dashboard
            </button>

            <button
              onClick={() => (window.location.href = "/admin/events")}
              className="w-full text-left px-4 py-3 rounded-lg text-blue-100/70 hover:bg-blue-500/20 hover:text-white transition"
            >
              Events
            </button>

            <div className="bg-blue-500/20 rounded-lg px-4 py-3 font-semibold">
              Stand Registrations
            </div>

            <button
              onClick={() => (window.location.href = "/admin/responses")}
              className="w-full text-left px-4 py-3 rounded-lg text-blue-100/70 hover:bg-blue-500/20 hover:text-white transition"
            >
              Responses
            </button>

            <button
              onClick={() => (window.location.href = "/admin/analytics")}
              className="w-full text-left px-4 py-3 rounded-lg text-blue-100/70 hover:bg-blue-500/20 hover:text-white transition"
            >
              Analytics
            </button>

            <button
              onClick={() => (window.location.href = "/admin/users")}
              className="w-full text-left px-4 py-3 rounded-lg text-blue-100/70 hover:bg-blue-500/20 hover:text-white transition"
            >
              Users
            </button>

          </nav>
        </div>

        {/* ACCOUNT & SIGN OUT - FIXED AT BOTTOM */}
        <div className="shrink-0 border-t border-white/10 p-6 bg-[#142b50]">

          <p className="font-semibold">
            Super Admin
          </p>

          <p className="text-xs text-blue-200 mt-1">
            Administrator
          </p>

          <button
            onClick={handleLogout}
            className="mt-5 text-sm text-red-300 hover:text-red-200 transition"
          >
            Sign Out
          </button>

        </div>
      </aside>

      {/* MAIN CONTENT - INDEPENDENT SCROLL */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto bg-[#f5f7fb] p-6 md:p-10">

        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <header className="flex flex-wrap justify-between items-center gap-4 mb-10">

            <div>
              <p className="text-sm font-semibold text-blue-600">
                SUPER ADMIN
              </p>

              <h1 className="text-3xl font-bold text-slate-900 mt-1">
                Stand Management
              </h1>

              <p className="text-slate-500 mt-2">
                Review and manage stand registrations.
              </p>
            </div>

            <button
              onClick={() => (window.location.href = "/admin")}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Back to Dashboard
            </button>

          </header>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm break-words">
              {error}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {message && (
            <div className="mb-5 rounded-xl bg-green-50 border border-green-200 p-4 text-green-700 text-sm break-words">
              {message}
            </div>
          )}

          {/* STATISTICS */}
          <section className="grid sm:grid-cols-3 gap-5 mb-8">

            {[
              ["Pending", pendingCount, "text-yellow-600"],
              ["Approved", approvedCount, "text-green-600"],
              ["Rejected", rejectedCount, "text-red-600"],
            ].map(([title, value, color]) => (
              <div
                key={String(title)}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <p className="text-sm text-slate-500">
                  {title}
                </p>

                <p className={`text-3xl font-bold mt-3 ${color}`}>
                  {value}
                </p>
              </div>
            ))}

          </section>

          {/* REGISTERED STANDS */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

            {/* SECTION HEADER */}
            <div className="p-6 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Registered Stands
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Review applications submitted by Stand Holders.
                </p>
              </div>

              <button
                onClick={loadStands}
                disabled={loading}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

            </div>

            {/* FILTER */}
            <div className="flex flex-wrap gap-2 p-5 border-b border-slate-100">

              {[
                ["all", "All"],
                ["pending", "Pending"],
                ["approved", "Approved"],
                ["rejected", "Rejected"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    filter === value
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}

            </div>

            {/* TABLE */}
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                Loading registrations...
              </div>
            ) : filteredStands.length === 0 ? (
              <div className="p-12 text-center">

                <p className="font-semibold text-slate-700">
                  No registrations found
                </p>

                <p className="text-sm text-slate-500 mt-2">
                  There are no stands in this category.
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full text-left">

                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-4">Stand</th>
                      <th className="p-4">Event</th>
                      <th className="p-4">Owner</th>
                      <th className="p-4">Registration</th>
                      <th className="p-4">Stand Status</th>
                      <th className="p-4">Public Form</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredStands.map((stand) => (
                      <tr
                        key={stand.standId}
                        className="hover:bg-slate-50"
                      >

                        {/* STAND */}
                        <td className="p-4">
                          <p className="font-semibold text-slate-900">
                            {stand.standName}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {stand.standId}
                          </p>
                        </td>

                        {/* EVENT */}
                        <td className="p-4 text-sm text-slate-700">
                          {stand.eventName}
                        </td>

                        {/* OWNER */}
                        <td className="p-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {stand.ownerName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {stand.ownerEmail}
                          </p>
                        </td>

                        {/* REGISTRATION STATUS */}
                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                              stand.registrationStatus
                            )}`}
                          >
                            {stand.registrationStatus}
                          </span>
                        </td>

                        {/* STAND STATUS */}
                        <td className="p-4 text-sm text-slate-600">
                          {stand.standStatus}
                        </td>

                        {/* PUBLIC FORM */}
                        <td className="p-4">
                          {stand.registrationStatus === "approved" &&
                          stand.standStatus === "active" ? (
                            <button
                              onClick={() => copyFormLink(stand.standId)}
                              className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                            >
                              Copy Form Link
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Not available
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">

                            {stand.registrationStatus === "pending" && (
                              <>
                                <button
                                  disabled={updatingId === stand.standId}
                                  onClick={() =>
                                    updateStatus(
                                      stand.standId,
                                      "approved",
                                      "inactive"
                                    )
                                  }
                                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
                                >
                                  Approve
                                </button>

                                <button
                                  disabled={updatingId === stand.standId}
                                  onClick={() =>
                                    updateStatus(
                                      stand.standId,
                                      "rejected",
                                      "inactive"
                                    )
                                  }
                                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {stand.registrationStatus === "approved" &&
                              stand.standStatus === "inactive" && (
                                <button
                                  disabled={updatingId === stand.standId}
                                  onClick={() =>
                                    updateStatus(
                                      stand.standId,
                                      "approved",
                                      "active"
                                    )
                                  }
                                  className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition"
                                >
                                  Activate
                                </button>
                              )}

                            {stand.registrationStatus === "approved" &&
                              stand.standStatus === "active" && (
                                <button
                                  disabled={updatingId === stand.standId}
                                  onClick={() =>
                                    updateStatus(
                                      stand.standId,
                                      "approved",
                                      "inactive"
                                    )
                                  }
                                  className="rounded-lg bg-slate-600 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition"
                                >
                                  Deactivate
                                </button>
                              )}

                            {updatingId === stand.standId && (
                              <span className="text-xs text-slate-500 self-center">
                                Updating...
                              </span>
                            )}

                            {stand.registrationStatus === "rejected" && (
                              <span className="text-xs text-slate-400">
                                No action
                              </span>
                            )}

                          </div>
                        </td>

                      </tr>
                    ))}

                  </tbody>
                </table>

              </div>
            )}

          </section>

        </div>
      </main>
    </div>
  );
}
