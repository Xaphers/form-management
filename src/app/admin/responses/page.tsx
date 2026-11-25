
"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

interface Answer {
  questionId: string;
  questionText: string;
  questionType: string;
  answer: string;
}

interface ResponseItem {
  submissionId: string;
  timestamp: string;
  eventId: string;
  eventName: string;
  standId: string;
  standName: string;
  participantName: string;
  answers: Answer[];
}

export default function ResponsesPage() {
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [standFilter, setStandFilter] = useState("all");

  const [selectedResponse, setSelectedResponse] =
    useState<ResponseItem | null>(null);

  async function loadResponses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/backend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "responses.list",
          data: {},
        }),
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Gagal mengambil data responses."
        );
      }

      setResponses(result.responses || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResponses();
  }, []);

  const events = useMemo(() => {
    const uniqueEvents = new Map();

    responses.forEach((item) => {
      uniqueEvents.set(item.eventId, {
        id: item.eventId,
        name: item.eventName,
      });
    });

    return Array.from(uniqueEvents.values());
  }, [responses]);

  const stands = useMemo(() => {
    const filtered = responses.filter((item) => {
      return (
        eventFilter === "all" ||
        item.eventId === eventFilter
      );
    });

    const uniqueStands = new Map();

    filtered.forEach((item) => {
      uniqueStands.set(item.standId, {
        id: item.standId,
        name: item.standName,
      });
    });

    return Array.from(uniqueStands.values());
  }, [responses, eventFilter]);

  const filteredResponses = useMemo(() => {
    return responses.filter((item) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        (item.participantName || "Anonymous")
          .toLowerCase()
          .includes(keyword) ||
        (item.standName || "").toLowerCase().includes(keyword) ||
        (item.eventName || "").toLowerCase().includes(keyword) ||
        (item.submissionId || "").toLowerCase().includes(keyword);

      const matchesEvent =
        eventFilter === "all" ||
        item.eventId === eventFilter;

      const matchesStand =
        standFilter === "all" ||
        item.standId === standFilter;

      return matchesSearch && matchesEvent && matchesStand;
    });
  }, [responses, search, eventFilter, standFilter]);

  function formatDate(value: string) {
    if (!value) return "-";

    const date = new Date(value);

    if (isNaN(date.getTime())) return value;

    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function exportCSV() {
    if (filteredResponses.length === 0) return;

    const questionMap = new Map<string, string>();

    filteredResponses.forEach((item) => {
      item.answers.forEach((answer) => {
        if (!questionMap.has(answer.questionId)) {
          questionMap.set(
            answer.questionId,
            answer.questionText
          );
        }
      });
    });

    const questionColumns = Array.from(questionMap.entries());

    const headers = [
      "No",
      "Submission ID",
      "Tanggal Pengisian",
      "Nama Event",
      "Nama Stand",
      "Nama Peserta",
      ...questionColumns.map(([, questionText]) => questionText),
    ];

    const rows = filteredResponses.map((item, index) => {
      const answerMap = new Map(
        item.answers.map((answer) => [
          answer.questionId,
          answer.answer,
        ])
      );

      return [
        index + 1,
        item.submissionId,
        formatDate(item.timestamp),
        item.eventName,
        item.standName,
        item.participantName || "Anonymous",
        ...questionColumns.map(
          ([questionId]) => answerMap.get(questionId) || "-"
        ),
      ];
    });

    function escapeCSV(value: unknown) {
      let text = String(value ?? "");

      if (/^[\s]*[=+\-@]/.test(text)) {
        text = "'" + text;
      }

      return `"${text.replace(/"/g, '""')}"`;
    }

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(";"))
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `Responses-Report-${date}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    await fetch("/api/backend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "auth.logout" }),
    });

    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-start bg-[#f5f7fb]">

      <AdminSidebar onLogout={handleLogout} />

      {/* MAIN CONTENT */}

      <main className="flex-1 min-w-0 bg-slate-50 p-6 sm:p-8">

        <div className="mx-auto max-w-7xl">

          {/* HEADER */}

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

            <div>
              <p className="text-sm text-blue-600 font-semibold">
                MANAGEMENT
              </p>

              <h1 className="text-3xl font-bold text-slate-900 mt-1">
                Responses Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage participant feedback.
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={loadResponses}
                disabled={loading}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Refresh
              </button>

              <button
                onClick={exportCSV}
                disabled={filteredResponses.length === 0}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Export CSV
              </button>

            </div>
          </div>

          {/* STATISTICS */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Responses
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {responses.length}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Events
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {events.length}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Stands
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {new Set(responses.map((item) => item.standId)).size}
              </h2>
            </div>

          </div>

          {/* FILTERS */}

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Search
                </label>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search participant, event, stand..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Filter Event
                </label>

                <select
                  value={eventFilter}
                  onChange={(e) => {
                    setEventFilter(e.target.value);
                    setStandFilter("all");
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="all">All Events</option>

                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Filter Stand
                </label>

                <select
                  value={standFilter}
                  onChange={(e) => setStandFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="all">All Stands</option>

                  {stands.map((stand) => (
                    <option key={stand.id} value={stand.id}>
                      {stand.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* RESPONSE TABLE */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-5">
              <h2 className="font-bold text-slate-900">
                All Responses
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredResponses.length} submission(s) found
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Loading responses...
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="p-12 text-center">
                <p className="font-semibold text-slate-700">
                  No Responses Found
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  No responses match your filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Participant</th>
                      <th className="px-5 py-4">Event</th>
                      <th className="px-5 py-4">Stand</th>
                      <th className="px-5 py-4">Questions</th>
                      <th className="px-5 py-4">Submitted At</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredResponses.map((item) => (
                      <tr
                        key={item.submissionId}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {item.participantName || "Anonymous"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.submissionId}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {item.eventName}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {item.standName}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {item.answers.length} Questions
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(item.timestamp)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedResponse(item)}
                            className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>

              </div>
            )}

          </div>

        </div>

        {/* RESPONSE DETAIL MODAL */}

        {selectedResponse && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            onClick={() => setSelectedResponse(null)}
          >

            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Response Details
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedResponse.submissionId}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedResponse(null)}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>

              </div>

              <div className="space-y-5 p-6">

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div>
                    <p className="text-xs text-slate-400">Participant</p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedResponse.participantName || "Anonymous"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Submitted At</p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDate(selectedResponse.timestamp)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Event</p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedResponse.eventName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Stand</p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedResponse.standName}
                    </p>
                  </div>

                </div>

                <div className="border-t border-slate-200 pt-5">

                  <div className="mb-4 flex items-center justify-between">

                    <h3 className="font-bold text-slate-900">
                      Participant Answers
                    </h3>

                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {selectedResponse.answers.length} Questions
                    </span>

                  </div>

                  <div className="space-y-4">

                    {selectedResponse.answers.map((answer, index) => (
                      <div
                        key={`${answer.questionId}-${index}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >

                        <p className="text-xs font-semibold uppercase text-indigo-600">
                          Question {index + 1}
                        </p>

                        <p className="mt-2 font-semibold text-slate-900">
                          {answer.questionText}
                        </p>

                        <div className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700">
                          <p className="whitespace-pre-wrap">
                            {answer.answer || "-"}
                          </p>
                        </div>

                      </div>
                    ))}

                  </div>
                </div>

              </div>

              <div className="border-t border-slate-200 p-5 text-right">
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
