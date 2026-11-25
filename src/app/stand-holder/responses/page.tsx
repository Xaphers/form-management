
"use client";

import { useEffect, useState } from "react";

interface Answer {
  questionId: string;
  questionText: string;
  questionType: string;
  answer: string;
}

interface ResponseItem {
  submissionId: string;
  timestamp: string;
  eventName: string;
  standName: string;
  participantName: string;
  answers: Answer[];
}

export default function MyResponsesPage() {
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ResponseItem | null>(null);
  const [standFilter, setStandFilter] = useState("all");

  async function loadResponses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "responses.my", data: {} }),
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil respons.");
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

  const stands = Array.from(
    new Set(responses.map((item) => item.standName))
  );

  const filteredResponses = responses.filter(
    (item) => standFilter === "all" || item.standName === standFilter
  );

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
    if (filteredResponses.length === 0) {
      setError("Tidak ada respons untuk diekspor.");
      return;
    }

    // Mengumpulkan semua pertanyaan unik dari respons yang ditampilkan.
    const questionMap = new Map<string, string>();

    filteredResponses.forEach((item) => {
      item.answers.forEach((answer) => {
        if (!questionMap.has(answer.questionId)) {
          questionMap.set(answer.questionId, answer.questionText);
        }
      });
    });

    const questions = Array.from(questionMap.entries());

    const headers = [
      "Submission ID",
      "Participant Name",
      "Event Name",
      "Stand Name",
      "Submitted At",
      ...questions.map(([, questionText]) => questionText),
    ];

    function escapeCSV(value: unknown) {
      let text = String(value ?? "");

      // Mencegah formula injection saat CSV dibuka di spreadsheet.
      if (/^[\s]*[=+\-@\t\r]/.test(text)) {
        text = "'" + text;
      }

      return `"${text.replace(/"/g, '""')}"`;
    }

    const rows = filteredResponses.map((item) => {
      const answerMap = new Map<string, string>();

      item.answers.forEach((answer) => {
        answerMap.set(answer.questionId, answer.answer || "");
      });

      return [
        item.submissionId,
        item.participantName || "Anonymous",
        item.eventName,
        item.standName,
        formatDate(item.timestamp),
        ...questions.map(([questionId]) => answerMap.get(questionId) || ""),
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(";"),
      ...rows.map((row) => row.map(escapeCSV).join(";")),
    ].join("\r\n");

    // BOM membantu Excel membaca karakter UTF-8.
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date().toISOString().slice(0, 10);
    const standName =
      standFilter === "all" ? "All-Stands" : standFilter;

    const safeName = standName
      .replace(/[^a-z0-9-_]/gi, "_")
      .slice(0, 50);

    link.href = url;
    link.download = `My-Responses-${safeName}-${date}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              STAND HOLDER
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              My Responses
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              View feedback submitted to your stands.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => (window.location.href = "/stand-holder")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back
            </button>

            <button
              onClick={loadResponses}
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Refresh
            </button>

            <button
              onClick={exportCSV}
              disabled={loading || filteredResponses.length === 0}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Total Responses</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {responses.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              My Stands with Responses
            </p>
            <p className="mt-3 text-3xl font-bold text-indigo-600">
              {stands.length}
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Filter Stand
          </label>

          <select
            value={standFilter}
            onChange={(e) => setStandFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 md:max-w-sm"
          >
            <option value="all">All My Stands</option>
            {stands.map((stand) => (
              <option key={stand} value={stand}>
                {stand}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-slate-400">
            Export CSV akan mengikuti stand yang sedang dipilih.
          </p>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="font-bold text-slate-900">Review History</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredResponses.length} response(s) found
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Loading responses...
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-700">
                No responses yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Participant feedback will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-4">Participant</th>
                    <th className="p-4">Event</th>
                    <th className="p-4">Stand</th>
                    <th className="p-4">Questions</th>
                    <th className="p-4">Submitted At</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredResponses.map((item) => (
                    <tr key={item.submissionId} className="hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">
                          {item.participantName || "Anonymous"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.submissionId}
                        </p>
                      </td>

                      <td className="p-4 text-slate-600">
                        {item.eventName}
                      </td>

                      <td className="p-4 text-slate-600">
                        {item.standName}
                      </td>

                      <td className="p-4 text-slate-600">
                        {item.answers.length} Questions
                      </td>

                      <td className="whitespace-nowrap p-4 text-slate-600">
                        {formatDate(item.timestamp)}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelected(item)}
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
        </section>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Response Details
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {selected.submissionId}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Participant</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selected.participantName || "Anonymous"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Submitted At</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {formatDate(selected.timestamp)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Event</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selected.eventName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Stand</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selected.standName}
                  </p>
                </div>
              </div>

              <div className="border-t pt-5">
                <h3 className="mb-4 font-bold text-slate-900">
                  Participant Answers
                </h3>

                <div className="space-y-4">
                  {selected.answers.map((answer, index) => (
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

            <div className="border-t p-5 text-right">
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
