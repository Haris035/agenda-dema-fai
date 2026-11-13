
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    CalendarDays,
    Clock3,
    MapPin,
    Search,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    ArrowRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Agenda = {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    flyer_url: string | null;
    event_date: string | null;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    registration_url: string | null;
    registration_deadline: string | null;
    status: "draft" | "published" | "archived";
    form_type: "acara" | "open_recruitment";
};

const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";

    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
};

const formatTime = (value: string | null) => {
    if (!value) return "";

    return value.slice(0, 5);
};

const formatDeadline = (value: string | null) => {
    if (!value) return "Tanpa batas waktu";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

export default function AgendaSlider() {
    const supabase = useMemo(() => createClient(), []);
    const sliderRef = useRef<HTMLDivElement>(null);

    const [agendas, setAgendas] = useState<Agenda[]>([]);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentTime, setCurrentTime] = useState<number | null>(null);

    useEffect(() => {
        setCurrentTime(Date.now());
    }, []);

    useEffect(() => {
        let active = true;

        async function fetchAgendas() {
            setLoading(true);
            setError("");

            const { data, error } = await supabase
                .from("agendas")
                .select(
                    "id, title, slug, description, category, flyer_url, event_date, start_time, end_time, location, registration_url, registration_deadline, status, form_type"
                )
                .eq("status", "published")
                .order("event_date", {
                    ascending: true,
                    nullsFirst: false,
                });

            if (!active) return;

            if (error) {
                console.error("Gagal mengambil agenda:", error);
                setError("Agenda belum dapat dimuat. Silakan coba lagi.");
                setAgendas([]);
            } else {
                setAgendas((data ?? []) as Agenda[]);
            }

            setLoading(false);
        }

        fetchAgendas();

        return () => {
            active = false;
        };
    }, [supabase]);

    const categories = useMemo(() => {
        return [
            "Semua",
            ...Array.from(
                new Set(agendas.map((agenda) => agenda.category))
            ),
        ];
    }, [agendas]);

    const filteredAgendas = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        return agendas.filter((agenda) => {
            const matchesSearch =
                agenda.title.toLowerCase().includes(keyword) ||
                agenda.description.toLowerCase().includes(keyword);

            const matchesCategory =
                activeCategory === "Semua" ||
                agenda.category === activeCategory;

            return matchesSearch && matchesCategory;
        });
    }, [agendas, search, activeCategory]);

    useEffect(() => {
        sliderRef.current?.scrollTo({
            left: 0,
            behavior: "smooth",
        });
    }, [activeCategory, search]);

    const moveSlider = (direction: "left" | "right") => {
        if (!sliderRef.current) return;

        const distance = sliderRef.current.clientWidth * 0.85;

        sliderRef.current.scrollBy({
            left: direction === "right" ? distance : -distance,
            behavior: "smooth",
        });
    };

    return (
        <div>
            {/* SEARCH */}
            <div className="mb-7 flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm md:flex-row md:items-center">
                <div className="flex flex-1 items-center gap-3 px-3">
                    <Search className="text-emerald-700" size={20} />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama kegiatan atau agenda..."
                        className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                    />
                </div>

                <span className="hidden h-8 w-px bg-slate-200 md:block" />

                <p className="px-3 text-xs font-medium text-slate-500">
                    Temukan kegiatan yang kamu cari
                </p>
            </div>

            {/* FILTER */}
            <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`shrink-0 rounded-full px-5 py-3 text-xs font-bold transition ${activeCategory === category
                            ? "bg-[#166534] text-white shadow-lg shadow-emerald-900/15"
                            : "border border-emerald-100 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-800"
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* SLIDER HEADER */}
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-extrabold text-slate-800">
                        Agenda Terbaru
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        {filteredAgendas.length} agenda ditemukan
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => moveSlider("left")}
                        aria-label="Agenda sebelumnya"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-800 transition hover:bg-emerald-50"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={() => moveSlider("right")}
                        aria-label="Agenda berikutnya"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#166534] text-white transition hover:bg-emerald-700"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* LOADING */}
            {loading ? (
                <div className="flex min-h-64 items-center justify-center rounded-3xl border border-emerald-100 bg-white">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />

                        <p className="text-sm text-slate-500">
                            Memuat agenda...
                        </p>
                    </div>
                </div>
            ) : error ? (
                <div className="rounded-3xl border border-red-100 bg-white py-16 text-center">
                    <p className="font-bold text-red-700">{error}</p>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 rounded-xl bg-[#166534] px-5 py-3 text-xs font-bold text-white"
                    >
                        Muat ulang halaman
                    </button>
                </div>
            ) : filteredAgendas.length > 0 ? (
                /* HORIZONTAL SLIDER */
                <div
                    ref={sliderRef}
                    className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {filteredAgendas.map((agenda) => {
                        const isRecruitment =
                            agenda.form_type === "open_recruitment";

                        const isClosed =
                            currentTime !== null &&
                            agenda.registration_deadline !== null &&
                            new Date(agenda.registration_deadline).getTime() <=
                            currentTime;

                        return (
                            <article
                                key={agenda.id}
                                className="group min-w-0 basis-[88%] shrink-0 snap-start overflow-hidden rounded-3xl border border-emerald-100 bg-white transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)]"
                            >
                                {/* FLYER */}
                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                                    {agenda.flyer_url ? (
                                        <img
                                            src={agenda.flyer_url}
                                            alt={`Flyer ${agenda.title}`}
                                            loading="lazy"
                                            decoding="async"
                                            className="h-full w-full object-contain object-center transition duration-300"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-green-900 to-emerald-500 text-white">
                                            <ImageIcon
                                                size={42}
                                                className="mb-3 opacity-70"
                                            />

                                            <p className="text-xs font-bold tracking-widest">
                                                DEMA FAI UIKA BOGOR
                                            </p>
                                        </div>
                                    )}

                                    {/* BADGE */}
                                    <div
                                        className={`absolute left-3 right-3 top-3 z-10 flex items-center gap-2 ${isRecruitment ? "justify-end" : "justify-between"
                                            }`}
                                    >
                                        {isRecruitment ? (
                                            <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                                                Open Recruitment
                                            </span>
                                        ) : (
                                            <>
                                                <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-green-800 shadow-sm backdrop-blur-sm">
                                                    {agenda.category}
                                                </span>

                                                <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                                                    Agenda Aktif
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* CONTENT */}
                                <div className="p-5 sm:p-6">
                                    <h3 className="line-clamp-2 text-lg font-extrabold leading-snug text-slate-800 transition group-hover:text-emerald-700">
                                        {agenda.title}
                                    </h3>

                                    <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-500">
                                        {agenda.description}
                                    </p>

                                    {/* INFORMASI AGENDA */}
                                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                                        {isRecruitment ? (
                                            /* OPEN RECRUITMENT: HANYA DEADLINE */
                                            <div className="flex items-start gap-3 text-xs text-slate-500">
                                                <CalendarDays
                                                    size={16}
                                                    className="mt-0.5 shrink-0 text-emerald-700"
                                                />

                                                <span>
                                                    <span className="font-semibold text-slate-700">
                                                        Deadline Pendaftaran:
                                                    </span>
                                                    <br />
                                                    {formatDeadline(
                                                        agenda.registration_deadline
                                                    )}
                                                </span>
                                            </div>
                                        ) : (
                                            /* AGENDA BIASA */
                                            <>
                                                <div className="flex items-start gap-3 text-xs text-slate-500">
                                                    <CalendarDays
                                                        size={16}
                                                        className="mt-0.5 shrink-0 text-emerald-700"
                                                    />

                                                    <span>
                                                        {formatDate(
                                                            agenda.event_date
                                                        )}
                                                    </span>
                                                </div>

                                                {(agenda.start_time ||
                                                    agenda.end_time) && (
                                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                                            <Clock3
                                                                size={16}
                                                                className="shrink-0 text-emerald-700"
                                                            />

                                                            <span>
                                                                {formatTime(
                                                                    agenda.start_time
                                                                ) || "--:--"}
                                                                {" - "}
                                                                {formatTime(
                                                                    agenda.end_time
                                                                ) || "--:--"}
                                                                {" WIB"}
                                                            </span>
                                                        </div>
                                                    )}

                                                {agenda.location && (
                                                    <div className="flex items-start gap-3 text-xs text-slate-500">
                                                        <MapPin
                                                            size={16}
                                                            className="mt-0.5 shrink-0 text-emerald-700"
                                                        />

                                                        <span className="line-clamp-2">
                                                            {agenda.location}
                                                        </span>
                                                    </div>
                                                )}

                                                {agenda.registration_deadline && (
                                                    <div className="flex items-start gap-3 text-xs text-slate-500">
                                                        <Clock3
                                                            size={16}
                                                            className="mt-0.5 shrink-0 text-emerald-700"
                                                        />

                                                        <span>
                                                            Deadline:{" "}
                                                            {formatDeadline(
                                                                agenda.registration_deadline
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* DETAIL */}
                                    <Link
                                        href={`/agenda/${agenda.slug}`}
                                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                                    >
                                        Lihat Detail
                                        <ArrowRight size={16} />
                                    </Link>

                                    {/* PENDAFTARAN */}
                                    {!agenda.registration_url ? (
                                        <div className="mt-2 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-500">
                                            Informasi Pendaftaran Belum Tersedia
                                        </div>
                                    ) : isClosed ? (
                                        <div className="mt-2 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                                            Pendaftaran Ditutup
                                        </div>
                                    ) : (
                                        <a
                                            href={agenda.registration_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 flex w-full items-center justify-center rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                                        >
                                            Daftar Sekarang
                                        </a>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-emerald-200 bg-white py-20 text-center">
                    <Search
                        className="mx-auto mb-4 text-emerald-200"
                        size={35}
                    />

                    <h3 className="font-bold text-slate-700">
                        Agenda tidak ditemukan
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                        Belum ada agenda yang sesuai dengan pencarianmu.
                    </p>
                </div>
            )}
        </div>
    );
}
