
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Question {
  questionId: string;
  questionOrder: number;
  questionText: string;
  questionType: string;
  options: string[];
  required: boolean;
}

interface Stand {
  standId: string;
  standName: string;
  eventId: string;
  eventName: string;
}

type AnswerValue = string | string[];

function PublicReviewContent() {
  const params = useParams<{ standId: string }>();
  const standId = params.standId;

  const [stand, setStand] = useState<Stand | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  async function apiRequest(action: string, data: object = {}) {
    const response = await fetch("/api/backend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        data,
      }),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Terjadi kesalahan.");
    }

    return result;
  }

  useEffect(() => {
  if (!standId) return;

  const storageKey = `review_submitted_${standId}`;
  const submitted = localStorage.getItem(storageKey);

  if (submitted === "true") {
    setAlreadySubmitted(true);
    setLoading(false);
    return;
  }

  loadForm();
}, [standId]);

  async function loadForm() {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest("public.review.get", {
        standId,
      });

      setStand(result.stand);
      setQuestions(result.questions || []);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil form review."
      );
    } finally {
      setLoading(false);
    }
  }

  

  function updateAnswer(
    questionId: string,
    value: AnswerValue
  ) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  }

  function toggleCheckbox(
    questionId: string,
    option: string,
    checked: boolean
  ) {
    setAnswers((previous) => {
      const current = previous[questionId];

      const selected = Array.isArray(current)
        ? current
        : [];

      const updated = checked
        ? [...selected, option]
        : selected.filter((item) => item !== option);

      return {
        ...previous,
        [questionId]: updated,
      };
    });
  }

  function isAnswered(question: Question) {
    const answer = answers[question.questionId];

    if (Array.isArray(answer)) {
      return answer.length > 0;
    }

    return String(answer || "").trim() !== "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    const missingQuestion = questions.find(
      (question) =>
        question.required && !isAnswered(question)
    );

    if (missingQuestion) {
      setError(
        `Mohon jawab pertanyaan: ${missingQuestion.questionText}`
      );

      document
        .getElementById(`question-${missingQuestion.questionId}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

      return;
    }

    const formattedAnswers = questions.map((question) => ({
      questionId: question.questionId,
      answer: answers[question.questionId] ?? "",
    }));

    try {
      setSubmitting(true);

      await apiRequest("public.review.submit", {
        standId,
        participantName,
      answers: formattedAnswers,
      });

      localStorage.setItem(`review_submitted_${standId}`, "true");
      setSuccess(true);

      setSuccess(true);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim review."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm text-slate-500">
            Loading review form...
          </p>
        </div>
      </main>
    );
  }

  if (error && !stand) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">!</div>

          <h1 className="text-xl font-bold text-slate-900">
            Form Tidak Tersedia
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (alreadySubmitted) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
          ✓
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Review Sudah Dikirim
        </h1>

        <p className="mt-3 text-slate-500">
          Browser ini sudah mengirim review untuk stand ini. Terima kasih!
        </p>
      </div>
    </main>
  );
}

  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
            ✓
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Thank You!
          </h1>

          <p className="mt-3 text-slate-500">
            Review kamu berhasil dikirim.
            Terima kasih sudah meluangkan waktu untuk memberikan
            feedback kepada {stand?.standName}.
          </p>

          <p className="mt-6 text-xs text-slate-400">
            Your response has been recorded.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">

        {/* Form Header */}
        <header className="mb-6 overflow-hidden rounded-2xl bg-indigo-700 p-7 text-white shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
            Event Review Form
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            {stand?.standName}
          </h1>

          <p className="mt-3 text-sm text-indigo-100">
            {stand?.eventName}
          </p>

          <div className="mt-6 border-t border-indigo-500 pt-5">
            <p className="text-sm leading-relaxed text-indigo-100">
              We value your feedback! Please take a moment to
              answer the questions below and help us improve.
            </p>
          </div>
        </header>

        {/* Form Information */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p>
            Fields marked with{" "}
            <span className="font-bold text-red-500">*</span>{" "}
            are required.
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-slate-800">
              No Questions Available
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              This stand has not created any review questions yet.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Participant Name */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Your Name
                <span className="ml-2 text-xs font-normal text-slate-400">
                  (Optional)
                </span>
              </label>

              <input
                type="text"
                value={participantName}
                onChange={(e) =>
                  setParticipantName(e.target.value)
                }
                maxLength={150}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </section>

            {/* Dynamic Questions */}
            {questions.map((question, index) => (
              <section
                key={question.questionId}
                id={`question-${question.questionId}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Question {index + 1}
                  </p>

                  <h2 className="text-base font-semibold leading-relaxed text-slate-900">
                    {question.questionText}

                    {question.required && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </h2>
                </div>

                {/* Short Answer */}
                {question.questionType === "short_answer" && (
                  <input
                    type="text"
                    maxLength={5000}
                    value={String(answers[question.questionId] ?? "")}
                    onChange={(e) =>
                      updateAnswer(question.questionId, e.target.value)
                    }
                    placeholder="Your answer..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                )}

                {/* Paragraph */}
                {question.questionType === "paragraph" && (
                  <textarea
                    rows={4}
                    maxLength={5000}
                    value={String(answers[question.questionId] ?? "")}
                    onChange={(e) =>
                      updateAnswer(question.questionId, e.target.value)
                    }
                    placeholder="Write your answer here..."
                    className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                )}

                {/* Multiple Choice */}
                {question.questionType === "multiple_choice" && (
                  <div className="space-y-3">
                    {question.options.map((option, i) => (
                      <label
                        key={i}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        <input
                          type="radio"
                          name={question.questionId}
                          value={option}
                          checked={
                            answers[question.questionId] === option
                          }
                          onChange={() =>
                            updateAnswer(question.questionId, option)
                          }
                          className="h-4 w-4 accent-indigo-600"
                        />

                        <span className="text-sm text-slate-700">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkbox */}
                {question.questionType === "checkbox" && (
                  <div className="space-y-3">
                    {question.options.map((option, i) => {
                      const selected = answers[question.questionId];

                      const checked =
                        Array.isArray(selected) &&
                        selected.includes(option);

                      return (
                        <label
                          key={i}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-indigo-300 hover:bg-indigo-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              toggleCheckbox(
                                question.questionId,
                                option,
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 accent-indigo-600"
                          />

                          <span className="text-sm text-slate-700">
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Rating */}
                {question.questionType === "rating" && (
                  <div>
                    <div className="flex flex-wrap gap-3">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() =>
                            updateAnswer(
                              question.questionId,
                              String(rating)
                            )
                          }
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                            answers[question.questionId] === String(rating)
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400"
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 flex w-full max-w-[288px] justify-between text-xs text-slate-400">
                      <span>Very Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                )}

                {/* Yes / No */}
                {question.questionType === "yes_no" && (
                  <div className="flex gap-3">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateAnswer(
                            question.questionId,
                            option.value
                          )
                        }
                        className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                          answers[question.questionId] === option.value
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            ))}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || questions.length === 0}
              className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting Review..." : "Submit Review"}
            </button>

            <p className="pb-5 text-center text-xs text-slate-400">
              Thank you for sharing your feedback.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

export default function PublicReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <p className="text-sm text-slate-500">
            Loading review form...
          </p>
        </main>
      }
    >
      <PublicReviewContent />
    </Suspense>
  );
}
