
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const response = await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "auth.me",
          data: {},
        }),
      });

      const result = await response.json();

      if (!result.success || result.user?.role !== "super_admin") {
        router.replace("/");
        return;
      }

      await loadUsers();
    } catch (err) {
      setError("Gagal memeriksa sesi login.");
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "users.list",
          data: {},
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || result.message || "Gagal mengambil data pengguna.");
      }

      setUsers(result.users || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data pengguna."
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(user: User) {
    const newStatus =
      user.status.toLowerCase() === "active" ? "inactive" : "active";

    const confirmation = window.confirm(
      `${newStatus === "active" ? "Aktifkan" : "Nonaktifkan"} akun ${user.name}?`
    );

    if (!confirmation) return;

    try {
      setUpdating(user.id);
      setError("");
      setSuccess("");

      const response = await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "users.update",
          data: {
            userId: user.id,
            status: newStatus,
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || result.message || "Gagal memperbarui status pengguna.");
      }

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item.id === user.id
            ? { ...item, status: newStatus }
            : item
        )
      );

      setSuccess(
        `Status akun ${user.name} berhasil diperbarui.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memperbarui pengguna."
      );
    } finally {
      setUpdating(null);
    }
  }

  async function handleDeleteUser(user: User) {
    if (user.role.toLowerCase() !== "stand_holder") {
      setError("Hanya akun Stand Holder yang dapat dihapus.");
      return;
    }

    const confirmation = window.confirm(
      `Apakah Anda yakin ingin menghapus akun "${user.name}"?\n\n` +
      "Tindakan ini tidak dapat dibatalkan. Data akun akan dihapus dari daftar pengguna."
    );

    if (!confirmation) return;

    try {
      setUpdating(user.id);
      setError("");
      setSuccess("");

      const response = await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "users.delete",
          data: {
            userId: user.id,
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || result.message || "Gagal menghapus pengguna."
        );
      }

      setUsers((previousUsers) =>
        previousUsers.filter((item) => item.id !== user.id)
      );

      setSuccess(`Akun ${user.name} berhasil dihapus.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus pengguna."
      );
    } finally {
      setUpdating(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "auth.logout",
          data: {},
        }),
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    router.replace("/");
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword);

      const matchesRole =
        roleFilter === "all" ||
        user.role.toLowerCase() === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        user.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) =>
      user.role.toLowerCase() === "stand_holder" &&
      user.status.toLowerCase() === "active"
  ).length;

  const inactiveUsers = users.filter(
    (user) =>
      user.role.toLowerCase() === "stand_holder" &&
      user.status.toLowerCase() !== "active"
  ).length;

  function formatDate(date: string) {
    if (!date || date === "Invalid Date") return "-";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen flex items-start bg-[#f5f7fb]">

      {/* SIDEBAR */}
      <aside className="sticky top-0 h-screen w-64 shrink-0 overflow-y-auto bg-[#142b50] text-white p-6 hidden md:flex flex-col">

        <div>
          <h1 className="text-2xl font-bold tracking-wide">
            Form
          </h1>

          <p className="mt-1 text-xs text-blue-200">
            Administration Panel
          </p>
        </div>

        <div className="mt-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-blue-300">
            Main Menu
          </p>

          <nav className="space-y-2">

            <a
              href="/admin"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-blue-100 hover:bg-white/10 transition"
            >
              <span>▦</span>
              Dashboard
            </a>

            <a
              href="/admin/events"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-blue-100 hover:bg-white/10 transition"
            >
              <span>◈</span>
              Events
            </a>

            <a
              href="/admin/stands"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-blue-100 hover:bg-white/10 transition"
            >
              <span>▤</span>
              Stand Registrations
            </a>

            <a
              href="/admin/responses"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-blue-100 hover:bg-white/10 transition"
            >
              <span>▧</span>
              Responses
            </a>

            <a
              href="/admin/analytics"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-blue-100 hover:bg-white/10 transition"
            >
              <span>◷</span>
              Analytics
            </a>

            <a
              href="/admin/users"
              className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold text-white transition"
            >
              <span>♙</span>
              Users
            </a>

          </nav>
        </div>

        {/* SIDEBAR BOTTOM */}
        <div className="mt-auto border-t border-white/15 pt-6">

          <div className="mb-5">
            <p className="text-sm font-semibold">
              Super Admin
            </p>

            <p className="mt-1 text-xs text-blue-200">
              Administrator
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-red-500/15 px-4 py-3 text-left text-sm font-medium text-red-200 hover:bg-red-500/25 transition"
          >
            ↪ Sign Out
          </button>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="min-w-0 flex-1 p-5 md:p-10">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <p className="text-sm font-medium text-blue-600">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-800">
              Users Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage registered users and their account access.
            </p>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            ↻ Refresh Data
          </button>

        </div>

        {/* ALERT */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {loading ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-slate-500">
              Loading users...
            </p>
          </div>

        ) : (

          <>

            {/* STATISTICS */}
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Total Users
                </p>

                <h2 className="mt-3 text-3xl font-bold text-slate-800">
                  {totalUsers}
                </h2>

                <p className="mt-2 text-xs text-slate-400">
                  All registered accounts
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Active Stand Holders
                </p>

                <h2 className="mt-3 text-3xl font-bold text-green-600">
                  {activeUsers}
                </h2>

                <p className="mt-2 text-xs text-slate-400">
                  Accounts currently active
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Inactive Stand Holders
                </p>

                <h2 className="mt-3 text-3xl font-bold text-orange-500">
                  {inactiveUsers}
                </h2>

                <p className="mt-2 text-xs text-slate-400">
                  Accounts currently inactive
                </p>
              </div>

            </div>

            {/* USERS TABLE */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 p-6">

                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-800">
                    Registered Users
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    View, activate, deactivate, or delete user accounts.
                  </p>
                </div>

                {/* SEARCH AND FILTER */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="stand_holder">Stand Holder</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                </div>

              </div>

              {/* TABLE */}
              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px] text-left">

                  <thead className="bg-slate-50">

                    <tr className="text-xs uppercase tracking-wider text-slate-500">

                      <th className="px-6 py-4 font-semibold">
                        User
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Role
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Status
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Created At
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredUsers.length === 0 ? (

                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-sm text-slate-400"
                        >
                          No users found.
                        </td>
                      </tr>

                    ) : (

                      filteredUsers.map((user) => {

                        const isSuperAdmin =
                          user.role.toLowerCase() === "super_admin";

                        const isActive =
                          user.status.toLowerCase() === "active";

                        return (

                          <tr
                            key={user.id}
                            className="transition hover:bg-slate-50/70"
                          >

                            {/* USER */}
                            <td className="px-6 py-5">

                              <p className="font-semibold text-slate-800">
                                {user.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {user.email}
                              </p>

                            </td>

                            {/* ROLE */}
                            <td className="px-6 py-5">

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  isSuperAdmin
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {isSuperAdmin
                                  ? "Super Admin"
                                  : "Stand Holder"}
                              </span>

                            </td>

                            {/* STATUS */}
                            <td className="px-6 py-5">

                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                  isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isActive
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                />

                                {user.status}
                              </span>

                            </td>

                            {/* CREATED AT */}
                            <td className="px-6 py-5 text-sm text-slate-500">
                              {formatDate(user.createdAt)}
                            </td>

                            {/* ACTIONS */}
                            <td className="px-6 py-5">

                              <div className="flex items-center justify-end gap-2">

                                {isSuperAdmin ? (

                                  <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                                    Protected
                                  </span>

                                ) : (

                                  <>

                                    <button
                                      type="button"
                                      disabled={updating === user.id}
                                      onClick={() => toggleUserStatus(user)}
                                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                        isActive
                                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                          : "bg-green-100 text-green-700 hover:bg-green-200"
                                      }`}
                                    >
                                      {updating === user.id
                                        ? "Processing..."
                                        : isActive
                                        ? "Deactivate"
                                        : "Activate"}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={updating === user.id}
                                      onClick={() => handleDeleteUser(user)}
                                      className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Delete
                                    </button>

                                  </>

                                )}

                              </div>

                            </td>

                          </tr>

                        );
                      })

                    )}

                  </tbody>

                </table>

              </div>

              {/* TABLE FOOTER */}
              <div className="border-t border-slate-100 px-6 py-4">

                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredUsers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {users.length}
                  </span>{" "}
                  users
                </p>

              </div>

            </div>

          </>

        )}

      </main>

    </div>
  );
}
