
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

interface StandItem {
  standId: string;
  eventId: string;
  eventName: string;
  standName: string;
  registrationStatus: string;
  standStatus: string;
  createdAt: string;
}

export default function StandRegistrationPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [stands, setStands] = useState<StandItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [standName, setStandName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function api(action: string, data = {}) {
    const response = await fetch("/api/backend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, data }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Permintaan gagal.");
    }

    return result;
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [eventResult, standResult] = await Promise.all([
        api("events.available"),
        api("stands.my"),
      ]);

      setEvents(
        (eventResult.events || []).filter(
          (event: EventItem) => event.status === "active"
        )
      );

      setStands(standResult.stands || []);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api("stands.register", {
        eventId,
        standName,
      });

      setMessage("Pendaftaran stand berhasil dikirim!");
      setEventId("");
      setStandName("");

      await loadData();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mendaftarkan stand."
      );
    } finally {
      setSaving(false);
    }
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

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">

        <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              STAND HOLDER
            </p>

            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              Stand Registration
            </h1>

            <p className="text-slate-500 mt-2">
              Register your stand for available events.
            </p>
          </div>

          <button
            onClick={() => window.location.href = "/stand-holder"}
            className="rounded-xl bg-white border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
        </header>

        {message && (
          <div className="mb-5 rounded-xl bg-green-50 border border-green-200 p-4 text-green-700 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Register a New Stand
          </h2>

          {loading ? (
            <p className="text-slate-500">Loading available events...</p>
          ) : events.length === 0 ? (
            <p className="text-slate-500">
              There are currently no active events available.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Event
                </label>

                <select
                  required
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900"
                >
                  <option value="">Choose an event</option>

                  {events.map((event) => (
                    <option
                      key={event.eventId}
                      value={event.eventId}
                    >
                      {event.eventName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Stand Name
                </label>

                <input
                  required
                  maxLength={150}
                  value={standName}
                  onChange={(e) => setStandName(e.target.value)}
                  placeholder="Example: Coffee Corner"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-700 px-6 py-3 text-white font-semibold hover:bg-blue-800 disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Submit Registration"}
              </button>

            </form>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              My Registered Stands
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Track the status of your stand registrations.
            </p>
          </div>

          {loading ? (
            <p className="p-8 text-center text-slate-500">
              Loading registrations...
            </p>
          ) : stands.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-700">
                No registrations yet
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Your registered stands will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">

                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-4">Stand Name</th>
                    <th className="p-4">Event</th>
                    <th className="p-4">Registration Status</th>
                    <th className="p-4">Stand Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {stands.map((stand) => (
                    <tr key={stand.standId}>

                      <td className="p-4">
                        <p className="font-semibold text-slate-900">
                          {stand.standName}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {stand.standId}
                        </p>
                      </td>

                      <td className="p-4 text-sm text-slate-600">
                        {stand.eventName}
                      </td>

                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(stand.registrationStatus)}`}>
                          {stand.registrationStatus}
                        </span>
                      </td>

                      <td className="p-4 text-sm text-slate-600">
                        {stand.standStatus}
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
  );
}
