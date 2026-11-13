
"use client";

import {
    Suspense,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    ImagePlus,
    Loader2,
    MapPin,
    Save,
    Send,
    UploadCloud,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type FormType = "acara" | "open_recruitment";
type AgendaStatus = "draft" | "published" | "archived";

type AgendaData = {
    id: string;
    title: string;
    slug: string;
    description: string;
    form_type: FormType | null;
    category: string;
    flyer_url: string | null;
    event_date: string | null;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    registration_url: string | null;
    registration_deadline: string | null;
    status: AgendaStatus;
};

function makeSlug(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function toLocalDateTime(value: string | null) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().slice(0, 16);
}

function toLocalDate(value: string | null) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().slice(0, 10);
}

// Komponen yang menggunakan useParams.
function EditAgendaContent() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const supabase = useMemo(() => createClient(), []);

    const [formType, setFormType] = useState<FormType>("acara");

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Seminar");
    const [description, setDescription] = useState("");

    const [eventDate, setEventDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [location, setLocation] = useState("");

    const [registrationUrl, setRegistrationUrl] = useState("");
    const [registrationDeadline, setRegistrationDeadline] = useState("");

    const [status, setStatus] = useState<AgendaStatus>("draft");

    const [currentFlyerUrl, setCurrentFlyerUrl] = useState<string | null>(
        null
    );
    const [flyer, setFlyer] = useState<File | null>(null);
    const [removeFlyer, setRemoveFlyer] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Mengambil data agenda yang akan diedit.
    useEffect(() => {
        let active = true;

        async function loadAgenda() {
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

                const { data, error: fetchError } = await supabase
                    .from("agendas")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (fetchError) {
                    throw new Error(
                        `Gagal mengambil data agenda: ${fetchError.message}`
                    );
                }

                if (!active) return;

                const agenda = data as AgendaData;

                setFormType(
                    agenda.form_type === "open_recruitment"
                        ? "open_recruitment"
                        : "acara"
                );

                setTitle(agenda.title ?? "");
                setCategory(agenda.category ?? "Seminar");
                setDescription(agenda.description ?? "");

                setEventDate(agenda.event_date?.slice(0, 10) ?? "");
                setStartTime(agenda.start_time?.slice(0, 5) ?? "");
                setEndTime(agenda.end_time?.slice(0, 5) ?? "");
                setLocation(agenda.location ?? "");

                setRegistrationUrl(agenda.registration_url ?? "");

                if (agenda.form_type === "open_recruitment") {
                    setRegistrationDeadline(
                        toLocalDate(agenda.registration_deadline)
                    );
                } else {
                    setRegistrationDeadline(
                        toLocalDateTime(agenda.registration_deadline)
                    );
                }

                setStatus(agenda.status ?? "draft");
                setCurrentFlyerUrl(agenda.flyer_url ?? null);
            } catch (err) {
                console.error("Gagal mengambil agenda:", err);

                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Terjadi kesalahan saat mengambil data agenda."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        if (id) {
            loadAgenda();
        }

        return () => {
            active = false;
        };
    }, [id, router, supabase]);

    function validateUrl(value: string) {
        try {
            const url = new URL(value);
            return (
                url.protocol === "https:" ||
                url.protocol === "http:"
            );
        } catch {
            return false;
        }
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        if (!title.trim() || !description.trim()) {
            setError("Judul dan deskripsi agenda wajib diisi.");
            return;
        }

        if (formType === "acara") {
            if (!eventDate || !location.trim()) {
                setError("Tanggal dan lokasi kegiatan wajib diisi.");
                return;
            }

            if (startTime && endTime && endTime <= startTime) {
                setError("Waktu selesai harus setelah waktu mulai.");
                return;
            }
        }

        if (formType === "open_recruitment") {
            if (!registrationUrl.trim()) {
                setError("Link Google Form wajib diisi.");
                return;
            }

            if (!registrationDeadline) {
                setError("Tanggal deadline wajib diisi.");
                return;
            }
        }

        if (
            registrationUrl.trim() &&
            !validateUrl(registrationUrl.trim())
        ) {
            setError(
                "Link pendaftaran harus berupa URL yang valid (http atau https)."
            );
            return;
        }

        if (flyer) {
            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp",
            ];

            if (!allowedTypes.includes(flyer.type)) {
                setError("Format flyer harus JPG, PNG, atau WEBP.");
                return;
            }

            if (flyer.size > 5 * 1024 * 1024) {
                setError("Ukuran flyer maksimal 5 MB.");
                return;
            }
        }

        let deadlineISO: string | null = null;

        if (registrationDeadline) {
            const deadlineDate =
                formType === "open_recruitment"
                    ? new Date(`${registrationDeadline}T23:59:59`)
                    : new Date(registrationDeadline);

            if (Number.isNaN(deadlineDate.getTime())) {
                setError("Batas waktu pendaftaran tidak valid.");
                return;
            }

            deadlineISO = deadlineDate.toISOString();
        }

        const slug = makeSlug(title);

        if (!slug) {
            setError("Judul agenda tidak dapat dijadikan slug.");
            return;
        }

        setSaving(true);

        let uploadedPath: string | null = null;

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

            let flyerUrl = removeFlyer ? null : currentFlyerUrl;

            if (flyer) {
                const extension =
                    flyer.name.split(".").pop()?.toLowerCase() || "jpg";

                uploadedPath = `${crypto.randomUUID()}.${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from("agenda-flyers")
                    .upload(uploadedPath, flyer, {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: flyer.type,
                    });

                if (uploadError) {
                    throw new Error(
                        `Upload flyer gagal: ${uploadError.message}`
                    );
                }

                const { data: publicUrlData } = supabase.storage
                    .from("agenda-flyers")
                    .getPublicUrl(uploadedPath);

                flyerUrl = publicUrlData.publicUrl;
            }

            const agendaData = {
                title: title.trim(),
                slug,
                description: description.trim(),

                form_type: formType,

                category:
                    formType === "open_recruitment"
                        ? "Open Recruitment"
                        : category,

                flyer_url: flyerUrl,

                event_date:
                    formType === "acara"
                        ? eventDate
                        : null,

                start_time:
                    formType === "acara"
                        ? startTime || null
                        : null,

                end_time:
                    formType === "acara"
                        ? endTime || null
                        : null,

                location:
                    formType === "acara"
                        ? location.trim()
                        : null,

                registration_url:
                    registrationUrl.trim() || null,

                registration_deadline: deadlineISO,

                status,
                updated_at: new Date().toISOString(),
            };

            const { error: updateError } = await supabase
                .from("agendas")
                .update(agendaData)
                .eq("id", id);

            if (updateError) {
                if (uploadedPath) {
                    await supabase.storage
                        .from("agenda-flyers")
                        .remove([uploadedPath]);
                }

                throw new Error(
                    `Gagal memperbarui agenda: ${updateError.message}`
                );
            }

            // Hapus flyer lama setelah update berhasil.
            if (currentFlyerUrl && (flyer || removeFlyer)) {
                try {
                    const oldUrl = new URL(currentFlyerUrl);
                    const marker =
                        "/storage/v1/object/public/agenda-flyers/";
                    const markerIndex =
                        oldUrl.pathname.indexOf(marker);

                    if (markerIndex !== -1) {
                        const oldPath = decodeURIComponent(
                            oldUrl.pathname.slice(
                                markerIndex + marker.length
                            )
                        );

                        if (oldPath) {
                            await supabase.storage
                                .from("agenda-flyers")
                                .remove([oldPath]);
                        }
                    }
                } catch (storageError) {
                    console.warn(
                        "Flyer lama tidak berhasil dihapus:",
                        storageError
                    );
                }
            }

            router.replace("/admin/dashboard");
            router.refresh();
        } catch (err) {
            console.error("Gagal mengedit agenda:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Terjadi kesalahan saat memperbarui agenda."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="text-center">
                    <Loader2
                        size={32}
                        className="mx-auto animate-spin text-green-800"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                        Memuat data agenda...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50">
            {/* HEADER */}
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
                    <Link
                        href="/admin/dashboard"
                        className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                        aria-label="Kembali ke dashboard"
                    >
                        <ArrowLeft size={19} />
                    </Link>

                    <div>
                        <h1 className="font-bold text-slate-900">
                            Admin DEMA FAI
                        </h1>
                        <p className="text-xs text-slate-500">
                            Edit agenda
                        </p>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                <div className="mb-7">
                    <p className="mb-2 text-sm font-semibold text-green-800">
                        MANAJEMEN AGENDA
                    </p>

                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Edit Agenda
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Perbarui informasi acara atau Open Recruitment DEMA FAI.
                    </p>
                </div>

                {error && !title && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* INFORMASI AGENDA */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6">
                            <h3 className="font-bold text-slate-900">
                                Informasi Agenda
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Pilih jenis agenda yang ingin dikelola.
                            </p>
                        </div>

                        <div className="mb-6 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormType("acara");
                                    setError("");
                                }}
                                className={`rounded-xl border p-4 text-left transition ${formType === "acara"
                                        ? "border-green-600 bg-green-50 ring-2 ring-green-100"
                                        : "border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <p className="font-bold text-slate-900">
                                    Acara / Kegiatan
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Seminar, diskusi, pelatihan, dan kegiatan lainnya.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setFormType("open_recruitment");
                                    setError("");
                                }}
                                className={`rounded-xl border p-4 text-left transition ${formType === "open_recruitment"
                                        ? "border-green-600 bg-green-50 ring-2 ring-green-100"
                                        : "border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <p className="font-bold text-slate-900">
                                    Open Recruitment
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Rekrutmen dengan pendaftaran melalui Google Form.
                                </p>
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label
                                    htmlFor="title"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Nama Agenda <span className="text-red-500">*</span>
                                </label>

                                <input
                                    id="title"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Masukkan nama agenda"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
                                />

                                <p className="mt-2 text-xs text-slate-400">
                                    Slug URL otomatis:{" "}
                                    <span className="font-medium text-slate-600">
                                        {makeSlug(title) || "nama-agenda"}
                                    </span>
                                </p>
                            </div>

                            {formType === "acara" && (
                                <div>
                                    <label
                                        htmlFor="category"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Kategori <span className="text-red-500">*</span>
                                    </label>

                                    <select
                                        id="category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
                                    >
                                        <option>Seminar</option>
                                        <option>Diskusi</option>
                                        <option>Organisasi</option>
                                        <option>Pelatihan</option>
                                        <option>Perlombaan</option>
                                        <option>Sosial</option>
                                        <option>Lainnya</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="description"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    {formType === "acara"
                                        ? "Deskripsi Agenda"
                                        : "Deskripsi Singkat Open Recruitment"}{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <textarea
                                    id="description"
                                    required
                                    rows={5}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Masukkan deskripsi agenda..."
                                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
                                />
                            </div>
                        </div>
                    </section>

                    {/* FLYER */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-green-50 p-2.5 text-green-800">
                                <ImagePlus size={20} />
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900">
                                    Poster / Flyer Agenda
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Pertahankan flyer lama atau unggah gambar baru.
                                </p>
                            </div>
                        </div>

                        {currentFlyerUrl && !removeFlyer && (
                            <div className="mb-5">
                                <p className="mb-2 text-sm font-semibold text-slate-700">
                                    Flyer saat ini
                                </p>

                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <img
                                        src={currentFlyerUrl}
                                        alt="Flyer agenda saat ini"
                                        className="max-h-80 w-full bg-slate-50 object-contain"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setRemoveFlyer(true);
                                        setFlyer(null);
                                    }}
                                    className="mt-3 text-xs font-medium text-red-600 hover:underline"
                                >
                                    Hapus flyer saat ini
                                </button>
                            </div>
                        )}

                        {removeFlyer && (
                            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Flyer lama akan dihapus setelah perubahan berhasil disimpan.
                                <button
                                    type="button"
                                    onClick={() => setRemoveFlyer(false)}
                                    className="ml-2 font-semibold underline"
                                >
                                    Batalkan
                                </button>
                            </div>
                        )}

                        <label
                            htmlFor="flyer"
                            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-9 text-center transition hover:border-green-600 hover:bg-green-50/50"
                        >
                            <UploadCloud
                                size={30}
                                className="mb-3 text-green-800"
                            />

                            <span className="text-sm font-semibold text-slate-800">
                                {flyer ? flyer.name : "Pilih gambar flyer baru"}
                            </span>

                            <span className="mt-2 text-xs text-slate-500">
                                JPG, PNG, atau WEBP · Maksimal 5 MB
                            </span>

                            <input
                                id="flyer"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                    setFlyer(e.target.files?.[0] ?? null);

                                    if (e.target.files?.[0]) {
                                        setRemoveFlyer(false);
                                    }
                                }}
                            />
                        </label>

                        {flyer && (
                            <button
                                type="button"
                                onClick={() => setFlyer(null)}
                                className="mt-3 text-xs font-medium text-red-600 hover:underline"
                            >
                                Batalkan gambar baru
                            </button>
                        )}
                    </section>

                    {/* WAKTU DAN LOKASI */}
                    {formType === "acara" && (
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                                    <CalendarDays size={20} />
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900">
                                        Waktu dan Lokasi
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Jadwal pelaksanaan kegiatan.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="eventDate"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Tanggal Kegiatan{" "}
                                        <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        id="eventDate"
                                        type="date"
                                        required
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="startTime"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        <Clock3 size={14} className="mr-1 inline" />
                                        Waktu Mulai
                                    </label>

                                    <input
                                        id="startTime"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="endTime"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        <Clock3 size={14} className="mr-1 inline" />
                                        Waktu Selesai
                                    </label>

                                    <input
                                        id="endTime"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="location"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        <MapPin size={14} className="mr-1 inline" />
                                        Lokasi Kegiatan{" "}
                                        <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        id="location"
                                        required
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Contoh: Auditorium UIKA Bogor"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* PENDAFTARAN */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6">
                            <h3 className="font-bold text-slate-900">
                                {formType === "acara"
                                    ? "Pendaftaran"
                                    : "Pendaftaran Open Recruitment"}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                {formType === "acara"
                                    ? "Tautkan formulir pendaftaran kegiatan."
                                    : "Seluruh informasi pendaftaran diarahkan ke Google Form."}
                            </p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label
                                    htmlFor="registrationUrl"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Link Google Form{" "}
                                    {formType === "open_recruitment" && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </label>

                                <input
                                    id="registrationUrl"
                                    type="url"
                                    required={formType === "open_recruitment"}
                                    value={registrationUrl}
                                    onChange={(e) =>
                                        setRegistrationUrl(e.target.value)
                                    }
                                    placeholder="https://forms.gle/..."
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
                                />

                                <p className="mt-2 text-xs text-slate-400">
                                    {formType === "acara"
                                        ? "Opsional. Kosongkan jika tidak diperlukan."
                                        : "Wajib diisi untuk Open Recruitment."}
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="deadline"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Tanggal Deadline Pendaftaran{" "}
                                    {formType === "open_recruitment" && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </label>

                                <input
                                    id="deadline"
                                    type={
                                        formType === "open_recruitment"
                                            ? "date"
                                            : "datetime-local"
                                    }
                                    required={formType === "open_recruitment"}
                                    value={registrationDeadline}
                                    onChange={(e) =>
                                        setRegistrationDeadline(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
                                />

                                <p className="mt-2 text-xs text-slate-400">
                                    {formType === "open_recruitment"
                                        ? "Deadline berlaku sampai pukul 23.59 pada tanggal yang dipilih. Google Form tidak otomatis tertutup."
                                        : "Opsional. Batas waktu pendaftaran acara."}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* STATUS */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <h3 className="font-bold text-slate-900">
                            Status Publikasi
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Tentukan status tampilan agenda di website.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <button
                                type="button"
                                onClick={() => setStatus("draft")}
                                className={`rounded-xl border p-4 text-left transition ${status === "draft"
                                        ? "border-amber-400 bg-amber-50 ring-2 ring-amber-100"
                                        : "border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <p className="font-semibold text-slate-900">
                                    Draft
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Belum ditampilkan.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatus("published")}
                                className={`rounded-xl border p-4 text-left transition ${status === "published"
                                        ? "border-green-500 bg-green-50 ring-2 ring-green-100"
                                        : "border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <p className="font-semibold text-slate-900">
                                    Published
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Tampil di website.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatus("archived")}
                                className={`rounded-xl border p-4 text-left transition ${status === "archived"
                                        ? "border-slate-500 bg-slate-100 ring-2 ring-slate-200"
                                        : "border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <p className="font-semibold text-slate-900">
                                    Archived
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Agenda diarsipkan.
                                </p>
                            </button>
                        </div>
                    </section>

                    {/* ERROR */}
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* TOMBOL */}
                    <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">
                        <Link
                            href="/admin/dashboard"
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Batal
                        </Link>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/10 transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />
                                    Menyimpan Perubahan...
                                </>
                            ) : status === "published" ? (
                                <>
                                    <Send size={17} />
                                    Simpan dan Publikasikan
                                </>
                            ) : (
                                <>
                                    <Save size={17} />
                                    Simpan Perubahan
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

// Komponen pembungkus Suspense untuk prerender Next.js.
export default function EditAgendaPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                    <div className="text-center">
                        <Loader2
                            size={32}
                            className="mx-auto animate-spin text-green-800"
                        />
                        <p className="mt-3 text-sm text-slate-500">
                            Memuat halaman edit agenda...
                        </p>
                    </div>
                </main>
            }
        >
            <EditAgendaContent />
        </Suspense>
    );
}
