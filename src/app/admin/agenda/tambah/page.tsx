"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

function makeSlug(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export default function TambahAgendaPage() {
    const router = useRouter();
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

    const [status, setStatus] = useState<"draft" | "published">("draft");
    const [flyer, setFlyer] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function validateUrl(value: string) {
        try {
            const url = new URL(value);
            return url.protocol === "https:" || url.protocol === "http:";
        } catch {
            return false;
        }
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        // Validasi informasi umum.
        if (!title.trim() || !description.trim()) {
            setError("Judul dan deskripsi agenda wajib diisi.");
            return;
        }

        // Validasi khusus acara.
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

        // Validasi khusus Open Recruitment.
        if (formType === "open_recruitment") {
            if (!registrationUrl.trim()) {
                setError("Link Google Form Open Recruitment wajib diisi.");
                return;
            }

            if (!registrationDeadline) {
                setError("Tanggal deadline Open Recruitment wajib diisi.");
                return;
            }
        }

        if (
            registrationUrl.trim() &&
            !validateUrl(registrationUrl.trim())
        ) {
            setError("Link pendaftaran harus berupa URL yang valid (http atau https).");
            return;
        }

        // Validasi flyer.
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

        // Konversi deadline menjadi timestamp.
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
            setError("Judul agenda tidak dapat dijadikan slug. Periksa judul.");
            return;
        }

        setLoading(true);

        let uploadedPath: string | null = null;

        try {
            // Pastikan pengguna masih login.
            const { data: userData, error: userError } =
                await supabase.auth.getUser();

            if (userError || !userData.user) {
                router.replace("/admin/login");
                return;
            }

            // Pastikan akun terdaftar sebagai admin.
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

            // Upload flyer jika dipilih.
            let flyerUrl: string | null = null;

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

            // Siapkan data sesuai jenis formulir.
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
            };

            const { error: insertError } = await supabase
                .from("agendas")
                .insert(agendaData);

            if (insertError) {
                // Hapus flyer jika penyimpanan agenda gagal.
                if (uploadedPath) {
                    await supabase.storage
                        .from("agenda-flyers")
                        .remove([uploadedPath]);
                }

                throw new Error(
                    `Gagal menyimpan agenda: ${insertError.message}`
                );
            }

            router.replace("/admin/dashboard");
            router.refresh();
        } catch (err) {
            console.error("Gagal menambahkan agenda:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Terjadi kesalahan saat menyimpan agenda."
            );
        } finally {
            setLoading(false);
        }
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
                            Tambah agenda
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
                        Tambah Agenda Baru
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Kelola informasi acara dan Open Recruitment DEMA FAI.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* INFORMASI AGENDA */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6">
                            <h3 className="font-bold text-slate-900">
                                Informasi Agenda
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Pilih jenis agenda yang ingin ditambahkan.
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
                                    Informasi rekrutmen dengan pendaftaran melalui Google Form.
                                </p>
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* JUDUL */}
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
                                    placeholder={
                                        formType === "acara"
                                            ? "Contoh: Seminar Nasional Pendidikan Islam"
                                            : "Contoh: Open Recruitment Pengurus DEMA FAI"
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
                                />

                                <p className="mt-2 text-xs text-slate-400">
                                    Slug URL otomatis:{" "}
                                    <span className="font-medium text-slate-600">
                                        {makeSlug(title) || "nama-agenda"}
                                    </span>
                                </p>
                            </div>

                            {/* KATEGORI KHUSUS ACARA */}
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

                            {/* DESKRIPSI */}
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
                                    placeholder={
                                        formType === "acara"
                                            ? "Jelaskan tujuan, rangkaian, dan informasi kegiatan..."
                                            : "Tuliskan pengantar singkat mengenai Open Recruitment. Informasi lengkap tersedia di Google Form..."
                                    }
                                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:ring-4 focus:ring-green-700/10"
                                />
                            </div>
                        </div>
                    </section>

                    {/* POSTER / FLYER */}
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
                                    Unggah gambar untuk membedakan setiap agenda.
                                </p>
                            </div>
                        </div>

                        <label
                            htmlFor="flyer"
                            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-9 text-center transition hover:border-green-600 hover:bg-green-50/50"
                        >
                            <UploadCloud size={30} className="mb-3 text-green-800" />

                            <span className="text-sm font-semibold text-slate-800">
                                {flyer ? flyer.name : "Pilih gambar flyer"}
                            </span>

                            <span className="mt-2 text-xs text-slate-500">
                                JPG, PNG, atau WEBP · Maksimal 5 MB
                            </span>

                            <input
                                id="flyer"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) =>
                                    setFlyer(e.target.files?.[0] ?? null)
                                }
                            />
                        </label>

                        {flyer && (
                            <button
                                type="button"
                                onClick={() => setFlyer(null)}
                                className="mt-3 text-xs font-medium text-red-600 hover:underline"
                            >
                                Hapus pilihan gambar
                            </button>
                        )}
                    </section>

                    {/* WAKTU DAN LOKASI KHUSUS ACARA */}
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
                                    : "Seluruh informasi dan proses pendaftaran diarahkan ke Google Form."}
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
                                        ? "Kosongkan jika pendaftaran belum dibuka atau tidak diperlukan."
                                        : "Wajib diisi. Calon pendaftar akan diarahkan ke formulir ini."}
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
                                        ? "Pendaftaran berlaku sampai pukul 23.59 pada tanggal yang dipilih. Google Form tidak otomatis tertutup."
                                        : "Opsional. Tombol pendaftaran di website dapat dinonaktifkan setelah deadline."}
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
                            Tentukan apakah agenda langsung ditampilkan di website.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => setStatus("draft")}
                                className={`rounded-xl border p-4 text-left transition ${status === "draft"
                                    ? "border-amber-400 bg-amber-50 ring-2 ring-amber-100"
                                    : "border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <p className="font-semibold text-slate-900">
                                    Simpan sebagai Draft
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Hanya tersimpan di dashboard admin.
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
                                    Publikasikan Sekarang
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Langsung tampil di halaman utama.
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
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-800 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/10 transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Menyimpan...
                                </>
                            ) : status === "published" ? (
                                <>
                                    <Send size={17} />
                                    Simpan dan Publikasikan
                                </>
                            ) : (
                                <>
                                    <Save size={17} />
                                    Simpan Draft
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}