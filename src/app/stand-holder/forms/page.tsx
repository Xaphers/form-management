
"use client";

import { useEffect, useState } from "react";

interface Stand {
  standId: string;
  eventId: string;
  eventName: string;
  standName: string;
  registrationStatus: string;
  standStatus: string;
}

interface Question {
  questionId: string;
  eventId: string;
  standId: string;
  questionOrder: number;
  questionText: string;
  questionType: string;
  options: string;
  required: boolean;
}

const questionTypes = [
  { value: "short_answer", label: "Short Answer" },
  { value: "paragraph", label: "Paragraph" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "checkbox", label: "Checkbox" },
  { value: "rating", label: "Rating (1–5)" },
  { value: "yes_no", label: "Yes / No" },
];

export default function FormsPage() {
  const [stands, setStands] = useState<Stand[]>([]);
  const [selectedStand, setSelectedStand] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("short_answer");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(true);

  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function apiRequest(action: string, data: object = {}) {
    const response = await fetch("/api/backend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, data }),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Terjadi kesalahan.");
    }

    return result;
  }

  async function loadStands() {
    try {
      setLoading(true);

      const result = await apiRequest("stands.my");

      const approvedStands = (result.stands || []).filter(
        (stand: Stand) =>
          stand.registrationStatus === "approved" &&
          stand.standStatus === "active"
      );

      setStands(approvedStands);

      if (approvedStands.length > 0) {
        setSelectedStand((current) => {
          if (
            current &&
            approvedStands.some(
              (stand: Stand) => stand.standId === current
            )
          ) {
            return current;
          }

          return approvedStands[0].standId;
        });
      } else {
        setSelectedStand("");
        setQuestions([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil data stand."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions(standId: string) {
    if (!standId) {
      setQuestions([]);
      return;
    }

    try {
      setError("");

      const result = await apiRequest("questions.list", { standId });

      setQuestions(result.questions || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil pertanyaan."
      );
    }
  }

  useEffect(() => {
    loadStands();
  }, []);

  useEffect(() => {
    if (selectedStand) {
      loadQuestions(selectedStand);
      resetForm();
    }
  }, [selectedStand]);

  function resetForm() {
    setQuestionText("");
    setQuestionType("short_answer");
    setOptions("");
    setRequired(true);
    setEditingId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!selectedStand) {
      setError("Pilih stand terlebih dahulu.");
      return;
    }

    if (!questionText.trim()) {
      setError("Pertanyaan tidak boleh kosong.");
      return;
    }

    if (
      ["multiple_choice", "checkbox"].includes(questionType) &&
      options.split("\n").filter((x) => x.trim()).length < 2
    ) {
      setError("Masukkan minimal dua pilihan jawaban.");
      return;
    }

    try {
      setSaving(true);

      const data = {
        standId: selectedStand,
        questionText: questionText.trim(),
        questionType,
        options,
        required,
      };

      if (editingId) {
        await apiRequest("questions.update", {
          ...data,
          questionId: editingId,
        });

        setMessage("Pertanyaan berhasil diperbarui.");
      } else {
        await apiRequest("questions.create", data);

        setMessage("Pertanyaan berhasil ditambahkan.");
      }

      resetForm();
      await loadQuestions(selectedStand);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan pertanyaan."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(question: Question) {
    setEditingId(question.questionId);
    setQuestionText(question.questionText);
    setQuestionType(question.questionType);
    setOptions(question.options || "");
    setRequired(question.required);

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(questionId: string) {
    const confirmed = window.confirm(
      "Apakah kamu yakin ingin menghapus pertanyaan ini?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await apiRequest("questions.delete", {
        standId: selectedStand,
        questionId,
      });

      setMessage("Pertanyaan berhasil dihapus.");

      if (editingId === questionId) {
        resetForm();
      }

      await loadQuestions(selectedStand);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menghapus pertanyaan."
      );
    }
  }

  function getTypeLabel(type: string) {
    return questionTypes.find((item) => item.value === type)?.label || type;
  }

  const currentStand = stands.find(
    (stand) => stand.standId === selectedStand
  );

  // Generate review URL automatically from selected Stand ID.
  const reviewUrl =
    typeof window !== "undefined" && selectedStand
      ? `${window.location.origin}/review/${encodeURIComponent(selectedStand)}`
      : "";

  async function copyReviewLink() {
    if (!reviewUrl) return;

    try {
      await navigator.clipboard.writeText(reviewUrl);
      setMessage("Review link berhasil disalin!");
      setError("");
    } catch {
      setError("Gagal menyalin link. Silakan salin URL secara manual.");
    }
  }

  function openReviewForm() {
    if (!reviewUrl) return;
    window.open(reviewUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading Form Builder...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a
              href="/stand-holder"
              className="text-sm text-indigo-600 hover:underline"
            >
              ← Back to Dashboard
            </a>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Form Builder
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create and manage review questions for your stand.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Total Questions</p>
            <p className="text-2xl font-bold">{questions.length}</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {stands.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold">No Active Stands</h2>

            <p className="mt-2 text-sm text-slate-500">
              Kamu belum memiliki stand yang sudah disetujui dan aktif.
            </p>

            <a
              href="/stand-holder"
              className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Back to Dashboard
            </a>
          </div>
        ) : (
          <>
            {/* Stand Selector */}
            <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="mb-2 block text-sm font-semibold">
                Select Your Stand
              </label>

              <select
                value={selectedStand}
                onChange={(e) => setSelectedStand(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {stands.map((stand) => (
                  <option key={stand.standId} value={stand.standId}>
                    {stand.standName} — {stand.eventName}
                  </option>
                ))}
              </select>

              {currentStand && (
                <p className="mt-3 text-sm text-slate-500">
                  Event: {currentStand.eventName}
                </p>
              )}
            </section>

            {/* Public Review Link */}
            <section className="mb-7 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    Public Review Link
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Bagikan link ini kepada pengunjung agar mereka dapat
                    mengisi review stand kamu.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Stand Active
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  readOnly
                  value={reviewUrl}
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                />

                <button
                  type="button"
                  onClick={copyReviewLink}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Copy Link
                </button>

                <button
                  type="button"
                  onClick={openReviewForm}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
                >
                  Open Form ↗
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Link dibuat otomatis berdasarkan stand yang kamu pilih.
              </p>
            </section>

            <div className="grid grid-cols-1 gap-7 lg:grid-cols-5">

              {/* Question Editor */}
              <section className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold">
                    {editingId ? "Edit Question" : "Add New Question"}
                  </h2>

                  <p className="mb-5 mt-1 text-sm text-slate-500">
                    Configure a question for your review form.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Question
                      </label>

                      <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="Example: How would you rate our product?"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        required
                      />

                      <p className="mt-1 text-right text-xs text-slate-400">
                        {questionText.length}/500
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Question Type
                      </label>

                      <select
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                      >
                        {questionTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {["multiple_choice", "checkbox"].includes(questionType) && (
                      <div>
                        <label className="mb-2 block text-sm font-semibold">
                          Answer Options
                        </label>

                        <textarea
                          value={options}
                          onChange={(e) => setOptions(e.target.value)}
                          rows={5}
                          placeholder={"Very Good\nGood\nAverage\nPoor"}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                        />

                        <p className="mt-1 text-xs text-slate-400">
                          Masukkan satu pilihan untuk setiap baris.
                        </p>
                      </div>
                    )}

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-4">
                      <input
                        type="checkbox"
                        checked={required}
                        onChange={(e) => setRequired(e.target.checked)}
                        className="h-4 w-4 accent-indigo-600"
                      />

                      <span>
                        <span className="block text-sm font-semibold">
                          Required Question
                        </span>
                        <span className="text-xs text-slate-500">
                          Participant wajib menjawab pertanyaan ini.
                        </span>
                      </span>
                    </label>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {saving
                          ? "Saving..."
                          : editingId
                            ? "Update Question"
                            : "Add Question"}
                      </button>

                      {editingId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </section>

              {/* Question List */}
              <section className="lg:col-span-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">
                        Your Questions
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Questions displayed in your review form.
                      </p>
                    </div>

                    <button
                      onClick={() => loadQuestions(selectedStand)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      Refresh
                    </button>
                  </div>

                  {questions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center">
                      <p className="font-semibold text-slate-700">
                        No Questions Yet
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Start by adding your first review question.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <div
                          key={question.questionId}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                                  Question {index + 1}
                                </span>

                                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                  {getTypeLabel(question.questionType)}
                                </span>

                                {question.required && (
                                  <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                                    Required
                                  </span>
                                )}
                              </div>

                              <p className="break-words font-semibold">
                                {question.questionText}
                              </p>

                              {["multiple_choice", "checkbox"].includes(
                                question.questionType
                              ) && (
                                <ul className="mt-3 space-y-1 text-sm text-slate-500">
                                  {question.options
                                    .split("\n")
                                    .filter((x) => x.trim())
                                    .map((option, i) => (
                                      <li key={i}>• {option.trim()}</li>
                                    ))}
                                </ul>
                              )}

                              {question.questionType === "rating" && (
                                <p className="mt-2 text-sm text-slate-500">
                                  Rating scale: 1–5
                                </p>
                              )}

                              {question.questionType === "yes_no" && (
                                <p className="mt-2 text-sm text-slate-500">
                                  Yes / No
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 gap-2">
                              <button
                                onClick={() => handleEdit(question)}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDelete(question.questionId)}
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
