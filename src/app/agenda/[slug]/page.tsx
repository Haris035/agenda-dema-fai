
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    MapPin,
    ExternalLink,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Agenda = {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    flyer_url: string | null;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string;
    registration_url: string | null;
    registration_deadline: string | null;
    status: string;
};

export default function AgendaDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const [slug, setSlug] = useState("");
    const [agenda, setAgenda] = useState<Agenda | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadParams() {
            const result = await params;

            if (active) {
                setSlug(result.slug);
            }
        }

        loadParams();

        return () => {
            active = false;
        };
    }, [params]);

    useEffect(() => {
        if (!slug) return;

        let active = true;

        async function fetchAgenda() {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("agendas")
                .select("*")
                .eq("slug", slug)
                .eq("status", "published")
                .maybeSingle();

            if (!active) return;

            if (error) {
                setError("Terjadi kesalahan saat mengambil data agenda.");
            } else if (!data) {
                setError("Agenda tidak ditemukan atau belum dipublikasikan.");
            } else {
                setAgenda(data as Agenda);
            }

            setLoading(false);
        }

        fetchAgenda();

        return () => {
            active = false;
        };
    }, [slug]);

    const formatDate = (date: string | null | undefined) => {
        if (!date || !date.trim()) return null;

        const parsedDate = new Date(`${date}T00:00:00`);

        if (Number.isNaN(parsedDate.getTime())) return null;

        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(parsedDate);
    };

    const formatTime = (time: string | null) =>
        time ? `${time.slice(0, 5)} WIB` : null;

    const isRegistrationClosed =
        agenda?.registration_deadline
            ? Date.now() > new Date(agenda.registration_deadline).getTime()
            : false;

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <Loader2 className="animate-spin text-green-700" size={36} />
            </main>
        );
    }

    if (error || !agenda) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
                <AlertCircle size={48} className="mb-4 text-red-500" />
                <h1 className="text-2xl font-bold text-slate-900">
                    Agenda Tidak Ditemukan
                </h1>
                <p className="mt-2 text-slate-500">
                    {error || "Agenda yang kamu cari tidak tersedia."}
                </p>
                <Link
                    href="/"
                    className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white"
                >
                    Kembali ke Beranda
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 pb-16">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                <Link
                    href="/"
                    className="mb-7 inline-flex items-center gap-2 font-medium text-green-800"
                >
                    <ArrowLeft size={18} />
                    Kembali ke Beranda
                </Link>

                <article className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                    {agenda.flyer_url && (
                        <div className="bg-slate-100">
                            <img
                                src={agenda.flyer_url}
                                alt={`Poster ${agenda.title}`}
                                className="mx-auto max-h-[520px] w-full object-contain"
                            />
                        </div>
                    )}

                    <div className="p-6 sm:p-10">
                        <span className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-800">
                            {agenda.category}
                        </span>

                        <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                            {agenda.title}
                        </h1>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2">
                            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                                <CalendarDays className="mt-1 text-green-700" />
                                <div>
                                    <p className="text-sm text-slate-500">Tanggal</p>
                                    <p className="font-semibold text-slate-900">
                                        {formatDate(agenda.event_date)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                                <Clock3 className="mt-1 text-green-700" />
                                <div>
                                    <p className="text-sm text-slate-500">Waktu</p>
                                    <p className="font-semibold text-slate-900">
                                        {formatTime(agenda.start_time) || "Belum ditentukan"}
                                        {agenda.end_time
                                            ? ` – ${formatTime(agenda.end_time)}`
                                            : ""}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                                <MapPin className="mt-1 text-green-700" />
                                <div>
                                    <p className="text-sm text-slate-500">Lokasi</p>
                                    <p className="font-semibold text-slate-900">
                                        {agenda.location}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <section className="mt-10">
                            <h2 className="text-xl font-bold text-slate-900">
                                Deskripsi Kegiatan
                            </h2>
                            <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">
                                {agenda.description}
                            </p>
                        </section>

                        <section className="mt-10 rounded-2xl border border-green-100 bg-green-50 p-6">
                            <h2 className="text-lg font-bold text-slate-900">
                                Pendaftaran Kegiatan
                            </h2>

                            {agenda.registration_deadline && (
                                <p className="mt-2 text-sm text-slate-600">
                                    Batas pendaftaran:{" "}
                                    {new Intl.DateTimeFormat("id-ID", {
                                        dateStyle: "long",
                                        timeStyle: "short",
                                    }).format(new Date(agenda.registration_deadline))}
                                </p>
                            )}

                            {!agenda.registration_url ? (
                                <p className="mt-4 text-sm text-slate-600">
                                    Informasi pendaftaran belum tersedia.
                                </p>
                            ) : isRegistrationClosed ? (
                                <p className="mt-4 font-semibold text-red-600">
                                    Pendaftaran telah ditutup.
                                </p>
                            ) : (
                                <a
                                    href={agenda.registration_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
                                >
                                    Daftar Sekarang
                                    <ExternalLink size={17} />
                                </a>
                            )}
                        </section>
                    </div>
                </article>
            </div>
        </main>
    );
}
