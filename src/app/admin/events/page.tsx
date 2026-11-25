
"use client";

import { useEffect, useState } from "react";

interface EventItem {
  eventId: string;
  eventName: string;
  description: string;
  standCapacity: number;
  startDate: string;
  endDate: string;
  status: string;
}

const emptyForm = {
  eventName: "",
  description: "",
  standCapacity: "10",
  startDate: "",
  endDate: "",
  status: "active",
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  async function loadEvents() {
    setLoading(true);
    setError("");

    try {
      const result = await api("events.list");
      setEvents(result.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat event.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function openCreate() {
    setEditingId("");
    setForm(emptyForm);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function openEdit(event: EventItem) {
    setEditingId(event.eventId);

    setForm({
      eventName: event.eventName,
      description: event.description || "",
      standCapacity: String(event.standCapacity),
      startDate: String(event.startDate).slice(0, 10),
      endDate: String(event.endDate).slice(0, 10),
      status: event.status,
    });

    setMessage("");
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const data = {
        ...form,
        standCapacity: Number(form.standCapacity),
      };

      if (editingId) {
        await api("events.update", {
          ...data,
          eventId: editingId,
        });

        setMessage("Event berhasil diperbarui.");
      } else {
        await api("events.create", data);
        setMessage("Event berhasil dibuat.");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId("");

      await loadEvents();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan event."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(eventId: string) {
    const confirmed = window.confirm(
      "Nonaktifkan event ini? Data event tidak akan dihapus permanen."
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api("events.delete", { eventId });

      setMessage("Event berhasil dinonaktifkan.");

      await loadEvents();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menonaktifkan event."
      );
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

  const activeCount = events.filter(
    (event) => event.status === "active"
  ).length;

  return (
    <div className="h-screen flex overflow-hidden bg-[#f5f7fb]">

      {/* SIDEBAR */}
      <aside className="w-64 h-screen shrink-0 bg-[#142b50] text-white flex flex-col overflow-hidden">

        {/* LOGO */}
        <div className="p-6 shrink-0">
          <h1 className="text-xl font-bold">
            <span className="text-blue-400">Form</span>
          </h1>
        </div>

        {/* MENU */}
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

            <div className="bg-blue-500/20 rounded-lg px-4 py-3 font-semibold">
              Events
            </div>

            <button
              onClick={() => (window.location.href = "/admin/stands")}
              className="w-full text-left px-4 py-3 rounded-lg text-blue-100/70 hover:bg-blue-500/20 hover:text-white transition"
            >
              Stand Registrations
            </button>

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

        {/* ACCOUNT & SIGN OUT */}
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

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto p-6 md:p-10">

        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <header className="flex flex-wrap justify-between items-center gap-4 mb-8">

            <div>
              <p className="text-sm text-blue-600 font-semibold">
                MANAGEMENT
              </p>

              <h1 className="text-3xl font-bold text-slate-900 mt-1">
                Event Management
              </h1>

              <p className="text-slate-500 mt-2">
                Create and manage all your events.
              </p>
            </div>

            <button
              onClick={openCreate}
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition"
            >
              + Create Event
            </button>

          </header>

          {/* SUCCESS MESSAGE */}
          {message && (
            <div className="mb-5 rounded-xl bg-green-50 border border-green-200 p-4 text-green-700 text-sm">
              {message}
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* STATISTICS */}
          <section className="grid sm:grid-cols-3 gap-5 mb-8">

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Total Events
              </p>

              <h2 className="text-3xl font-bold mt-3 text-slate-900">
                {events.length}
              </h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Active Events
              </p>

              <h2 className="text-3xl font-bold mt-3 text-green-600">
                {activeCount}
              </h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Inactive / Completed
              </p>

              <h2 className="text-3xl font-bold mt-3 text-slate-700">
                {events.length - activeCount}
              </h2>
            </div>

          </section>

          {/* CREATE / EDIT FORM */}
          {showForm && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">

              <h2 className="text-xl font-bold text-slate-900 mb-6">
                {editingId ? "Edit Event" : "Create New Event"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* EVENT NAME */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">
                    Event Name
                  </label>

                  <input
                    required
                    maxLength={150}
                    value={form.eventName}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        eventName: e.target.value,
                      })
                    }
                    placeholder="Example: Technology Expo 2026"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">
                    Description
                  </label>

                  <textarea
                    maxLength={2000}
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe your event..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* CAPACITY & DATES */}
                <div className="grid md:grid-cols-3 gap-5">

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700">
                      Stand Capacity
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="10000"
                      required
                      value={form.standCapacity}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          standCapacity: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700">
                      Start Date
                    </label>

                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700">
                      End Date
                    </label>

                    <input
                      type="date"
                      required
                      min={form.startDate || undefined}
                      value={form.endDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                </div>

                {/* STATUS */}
                {editingId && (
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700">
                      Status
                    </label>

                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          status: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                )}

                {/* FORM BUTTONS */}
                <div className="flex flex-wrap gap-3">

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-700 px-6 py-3 text-white font-semibold hover:bg-blue-800 disabled:opacity-50 transition"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Save Changes"
                      : "Create Event"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>

                </div>
              </form>
            </section>
          )}

          {/* ALL EVENTS TABLE */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

            <div className="p-6 border-b border-slate-200">
              <h2 className="font-bold text-lg text-slate-900">
                All Events
              </h2>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500">
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center">

                <p className="text-slate-700 font-semibold">
                  No events yet
                </p>

                <p className="text-slate-500 text-sm mt-2">
                  Create your first event to get started.
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full text-left">

                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-4">Event</th>
                      <th className="p-4">Capacity</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {events.map((event) => (
                      <tr
                        key={event.eventId}
                        className="hover:bg-slate-50"
                      >

                        <td className="p-4">
                          <p className="font-semibold text-slate-900">
                            {event.eventName}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {event.eventId}
                          </p>
                        </td>

                        <td className="p-4 text-slate-600">
                          {event.standCapacity} stands
                        </td>

                        <td className="p-4 text-sm text-slate-600">
                          {String(event.startDate).slice(0, 10)}
                          <br />
                          <span className="text-slate-400">
                            to
                          </span>{" "}
                          {String(event.endDate).slice(0, 10)}
                        </td>

                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              event.status === "active"
                                ? "bg-green-100 text-green-700"
                                : event.status === "completed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {event.status}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex gap-3">

                            <button
                              onClick={() => openEdit(event)}
                              className="text-sm font-semibold text-blue-700 hover:underline"
                            >
                              Edit
                            </button>

                            {event.status !== "inactive" && (
                              <button
                                onClick={() =>
                                  handleDelete(event.eventId)
                                }
                                className="text-sm font-semibold text-red-600 hover:underline"
                              >
                                Deactivate
                              </button>
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
