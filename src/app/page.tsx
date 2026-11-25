
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isRegister ? "auth.register" : "auth.login",
          data: isRegister
            ? { name, email, password }
            : { email, password },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Terjadi kesalahan.");
      }

      if (isRegister) {
        setSuccess("Account created successfully! Please sign in.");
        setIsRegister(false);
        setName("");
        setPassword("");
      } else {
        if (result.user.role === "super_admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/stand-holder";
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode(register: boolean) {
    setIsRegister(register);
    setError("");
    setSuccess("");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex">
      <section className="hidden lg:flex lg:w-1/2 bg-[#142b50] text-white p-16 flex-col justify-between">
        <div>
          <div className="text-2xl font-bold tracking-wide">
            <span className="text-blue-400">Form</span>
          </div>

          <div className="mt-32 max-w-lg">
            <p className="text-blue-300 text-sm font-semibold tracking-[0.25em] uppercase">
              Event Feedback Platform
            </p>

            <h1 className="text-5xl font-bold leading-tight mt-5">
              Every Event.
              <br />
              Every Experience.
              <br />
              Better Together.
            </h1>

            <p className="text-blue-100/70 mt-7 leading-7">
              Manage your events, stands, and participant feedback
              through one integrated platform.
            </p>
          </div>
        </div>

        <p className="text-sm text-blue-200/60">
          Form Management Platform © 2026
        </p>
      </section>

      <section className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-xl font-bold text-[#142b50] mb-12">
            Form Management
          </div>

          <div className="mb-10">
            <p className="text-sm font-semibold text-blue-600">
              {isRegister ? "JOIN FORM" : "WELCOME BACK"}
            </p>

            <h2 className="text-3xl font-bold text-slate-900 mt-3">
              {isRegister ? "Create your account" : "Sign in to your account"}
            </h2>

            <p className="text-slate-500 mt-3">
              {isRegister
                ? "Register as a Stand Holder to manage your event stand."
                : "Enter your credentials to access your dashboard."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={10}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 10 characters"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1d4ed8] py-4 font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <div className="text-center mt-7 text-sm text-slate-500">
            {isRegister ? "Already have an account?" : "Don't have an account?"}
            {" "}
            <button
              type="button"
              onClick={() => switchMode(!isRegister)}
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              {isRegister ? "Sign In" : "Create Account"}
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-10">
            Secure access · Form Management System
          </p>
        </div>
      </section>
    </main>
  );
}
