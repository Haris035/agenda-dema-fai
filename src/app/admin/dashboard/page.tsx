
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    CalendarDays,
    Plus,
    RefreshCw,
    LogOut,
    FileText,
    Eye,
    Archive,
    Trash2,
    Loader2,
    LayoutDashboard,
    CheckCircle2,
    Clock3,
    AlertCircle,
    Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Agenda = {
    id: string;
    title: string;
    slug: string;
    category: string;
    event_date: string;
    location: string;
    status: "draft" | "published" | "archived";
    created_at: string;
};

export default function AdminDashboardPage() {
    const router = useRouter();
    const supabase = createClient();

    const [agendas, setAgendas] = useState<Agenda[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const loadAgendas = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const { data: userData, error: userError } =
                await supabase.auth.getUser();

            if (userError || !userData.user) {
                router.replace("/admin/login");
                return;
            }

            const { data: admin, error: adminError } = await supabase
                .from("admin_users")
                .select("user_id")
                .eq("user_id", userData.user.id)
                .maybeSingle();

            if (adminError || !admin) {
                await supabase.auth.signOut();
                router.replace("/admin/login");
                return;
            }

            const { data, error: agendaError } = await supabase
                .from("agendas")
                .select(
                    "id, title, slug, category, event_date, location, status, created_at"
                )
                .order("created_at", { ascending: false });

            if (agendaError) {
                throw agendaError;
            }

            setAgendas((data ?? []) as Agenda[]);
        } catch (err) {
            console.error("Gagal memuat agenda:", err);
            setError("Agenda belum dapat dimuat. Periksa koneksi Supabase dan kebijakan RLS.");
        } finally {
            setLoading(false);
        }
    }, [router, supabase]);

    useEffect(() => {
        loadAgendas();
    }, [loadAgendas]);

    async function handleLogout() {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        router.refresh();
    }

    async function handleStatusChange(
        agenda: Agenda,
        nextStatus: "published" | "archived"
    ) {
        const confirmation =
            nextStatus === "archived"
                ? `Arsipkan agenda "${agenda.title}"?`
                : `Terbitkan kembali agenda "${agenda.title}"?`;

        if (!window.confirm(confirmation)) return;

        setActionId(agenda.id);
        setError("");

        const { error: updateError } = await supabase
            .from("agendas")
            .update({ status: nextStatus, updated_at: new Date().toISOString() })
            .eq("id", agenda.id);

        if (updateError) {
            setError(`Gagal mengubah status: ${updateError.message}`);
        } else {
            await loadAgendas();
        }

        setActionId(null);
    }

    async function handleDelete(agenda: Agenda) {
        const confirmation = window.confirm(
            `Yakin ingin menghapus agenda "${agenda.title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`
        );

        if (!confirmation) return;

        setActionId(agenda.id);
        setError("");

        const { error: deleteError } = await supabase
            .from("agendas")
            .delete()
            .eq("id", agenda.id);

        if (deleteError) {
            setError(`Gagal menghapus agenda: ${deleteError.message}`);
        } else {
            await loadAgendas();
        }

        setActionId(null);
    }

    function formatDate(date: string) {
        return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    const total = agendas.length;
    const published = agendas.filter((item) => item.status === "published").length;
    const drafts = agendas.filter((item) => item.status === "draft").length;
    const archived = agendas.filter((item) => item.status === "archived").length;

    const statistics = [
        {
            label: "Total Agenda",
            value: total,
            icon: CalendarDays,
            color: "bg-blue-50 text-blue-700",
        },
        {
            label: "Dipublikasikan",
            value: published,
            icon: CheckCircle2,
            color: "bg-green-50 text-green-700",
        },
        {
            label: "Draft",
            value: drafts,
            icon: Clock3,
            color: "bg-amber-50 text-amber-700",
        },
        {
            label: "Diarsipkan",
            value: archived,
            icon: Archive,
            color: "bg-slate-100 text-slate-700",
        },
    ];

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-800 text-white">
                            <LayoutDashboard size={22} />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-900">
                                Admin DEMA FAI
                            </h1>
                            <p className="text-xs text-slate-500">
                                Panel pengelolaan agenda
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/"
                            target="_blank"
                            className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
                        >
                            Lihat Website
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Keluar</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-2 text-sm font-semibold text-green-800">
                            ADMINISTRATOR AREA
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Dashboard
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Kelola publikasi dan informasi agenda kegiatan DEMA FAI UIKA Bogor.
                        </p>
                    </div>

                    <Link
                        href="/admin/agenda/tambah"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/10 transition hover:bg-green-900"
                    >
                        <Plus size={18} />
                        Tambah Agenda
                    </Link>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {statistics.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                        {item.label}
                                    </p>
                                    <div className={`rounded-xl p-2 ${item.color}`}>
                                        <Icon size={19} />
                                    </div>
                                </div>
                                <p className="mt-4 text-3xl font-bold text-slate-900">
                                    {loading ? "—" : item.value}
                                </p>
                            </div>
                        );
                    })}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="font-bold text-slate-900">
                                Daftar Agenda
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Semua agenda yang tersimpan di database.
                            </p>
                        </div>

                        <button
                            onClick={loadAgendas}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={loading ? "animate-spin" : ""}
                            />
                            Perbarui
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                            <Loader2 size={28} className="animate-spin text-green-800" />
                            <p className="text-sm">Memuat data agenda...</p>
                        </div>
                    ) : agendas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                            <div className="mb-4 rounded-2xl bg-green-50 p-4 text-green-800">
                                <FileText size={30} />
                            </div>
                            <h4 className="font-semibold text-slate-900">
                                Belum ada agenda
                            </h4>
                            <p className="mt-2 max-w-sm text-sm text-slate-500">
                                Mulai tambahkan agenda kegiatan agar dapat dikelola melalui dashboard ini.
                            </p>
                            <Link
                                href="/admin/agenda/tambah"
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-900"
                            >
                                <Plus size={17} />
                                Tambah Agenda Pertama
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">Agenda</th>
                                        <th className="px-5 py-4 font-semibold">Tanggal</th>
                                        <th className="px-5 py-4 font-semibold">Status</th>
                                        <th className="px-5 py-4 text-right font-semibold">
                                            Tindakan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {agendas.map((agenda) => (
                                        <tr key={agenda.id} className="hover:bg-slate-50/70">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900">
                                                    {agenda.title}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {agenda.category} · {agenda.location}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                {formatDate(agenda.event_date)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${agenda.status === "published"
                                                        ? "bg-green-50 text-green-700"
                                                        : agenda.status === "draft"
                                                            ? "bg-amber-50 text-amber-700"
                                                            : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
                                                    {agenda.status === "published"
                                                        ? "Terbit"
                                                        : agenda.status === "draft"
                                                            ? "Draft"
                                                            : "Arsip"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/agenda/${agenda.id}/edit`}
                                                        title="Edit agenda"
                                                        className="rounded-lg border border-blue-100 p-2 text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Pencil size={16} />
                                                    </Link>
                                                    {agenda.status === "published" ? (
                                                        <button
                                                            onClick={() =>
                                                                handleStatusChange(agenda, "archived")
                                                            }
                                                            disabled={actionId === agenda.id}
                                                            title="Arsipkan agenda"
                                                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                                        >
                                                            <Archive size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                handleStatusChange(agenda, "published")
                                                            }
                                                            disabled={actionId === agenda.id}
                                                            title="Terbitkan agenda"
                                                            className="rounded-lg border border-green-200 p-2 text-green-700 hover:bg-green-50 disabled:opacity-50"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDelete(agenda)}
                                                        disabled={actionId === agenda.id}
                                                        title="Hapus permanen"
                                                        className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        {actionId === agenda.id ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <p className="mt-5 text-center text-xs text-slate-400">
                    DEMA FAI UIKA Bogor · Panel Administrator
                </p>
            </div>
        </main>
    );
}
