
"use client";

import AgendaSlider from "@/components/AgendaSlider";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  Menu,
  X,
  Globe,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const categories = [
  "Semua",
  "Seminar",
  "Diskusi",
  "Organisasi",
  "Pelatihan",
];

const events = [
  {
    id: 1,
    title: "Seminar Nasional Pendidikan Islam",
    category: "Seminar",
    description:
      "Ruang belajar dan bertukar gagasan mengenai perkembangan pendidikan Islam di era digital.",
    date: "Contoh jadwal kegiatan",
    location: "Universitas",
    deadline: "Contoh deadline",
    status: "Pendaftaran Dibuka",
    theme: "green",
    tag: "SEMINAR NASIONAL",
  },
  {
    id: 2,
    title: "Forum Aspirasi Mahasiswa FAI",
    category: "Diskusi",
    description:
      "Wadah dialog, diskusi, dan penyampaian aspirasi untuk membangun lingkungan fakultas yang lebih baik.",
    date: "Contoh jadwal kegiatan",
    location: "Fakultas Agama Islam",
    deadline: "Contoh deadline",
    status: "Pendaftaran Dibuka",
    theme: "emerald",
    tag: "FORUM DISKUSI",
  },
  {
    id: 3,
    title: "Pelatihan Kepemimpinan Mahasiswa",
    category: "Pelatihan",
    description:
      "Mengembangkan kemampuan kepemimpinan, komunikasi, dan kolaborasi mahasiswa.",
    date: "Contoh jadwal kegiatan",
    location: "Universitas",
    deadline: "Contoh deadline",
    status: "Segera Hadir",
    theme: "lime",
    tag: "LEADERSHIP",
  },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchCategory =
        activeCategory === "Semua" ||
        event.category === activeCategory;

      const matchSearch =
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.description.toLowerCase().includes(search.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [activeCategory, search]);

  return (
    <main className="min-h-screen bg-[#f7faf7] text-[#17291e]">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

          <a href="#" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#166534] text-white shadow-lg shadow-emerald-900/15">
              <GraduationCap size={25} />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">
                AGENDA <span className="text-emerald-600">DEMA</span>
              </h1>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500">
                FAKULTAS AGAMA ISLAM
              </p>
            </div>
          </a>


          <nav className="hidden items-center gap-8 md:flex">
            <a href="#" className="text-sm font-bold text-emerald-700">
              Beranda
            </a>
            <a href="#agenda" className="text-sm font-medium text-slate-600 transition hover:text-emerald-700">
              Agenda
            </a>
            <a href="https://aspirasi.demafaiuika.my.id" className="text-sm font-medium text-slate-600 transition hover:text-emerald-700">
              Aspirasi
            </a>
            <a href="#tentang" className="text-sm font-medium text-slate-600 transition hover:text-emerald-700">
              Tentang
            </a>
          </nav>

          <div className="hidden md:block">
            <a
              href="#agenda"
              className="rounded-xl bg-[#166534] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#14532d]"
            >
              Jelajahi Agenda <ArrowRight className="ml-2 inline" size={15} />
            </a>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-emerald-900 md:hidden"
            aria-label="Buka menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-emerald-100 bg-white px-5 py-5 md:hidden">
            <div className="flex flex-col gap-4 text-sm font-semibold">
              <a href="#" onClick={() => setMenuOpen(false)}>Beranda</a>
              <a href="#agenda" onClick={() => setMenuOpen(false)}>Agenda</a>
              <a href="https://aspirasi.demafaiuika.my.id" onClick={() => setMenuOpen(false)}>Aspirasi</a>
              <a href="#tentang" onClick={() => setMenuOpen(false)}>Tentang</a>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#123b27]">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 py-20 text-center md:py-28 lg:py-32">

          {/* LOGO DEMA */}
          <div className="mb-8 h-28 w-28 overflow-hidden rounded-full border-2 border-white/30 bg-white shadow-2xl shadow-black/20 md:h-36 md:w-36">
            <img
              src="/images/logo-dema.jpeg"
              alt="Logo DEMA FAI UIKA Bogor"
              className="h-full w-full rounded-full object-cover"
            />
          </div>

          {/* JUDUL */}
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-6xl">
            DEMA FAI
            <span className="mt-2 block text-emerald-300">
              UIKA BOGOR
            </span>
          </h2>

          {/* DESKRIPSI */}
          <p className="mt-7 max-w-2xl text-sm leading-8 text-emerald-50/80 md:text-base">
            Selamat datang di pusat informasi agenda Dewan Eksekutif
            Mahasiswa Fakultas Agama Islam Universitas Ibn Khaldun Bogor.
          </p>

          {/* BUTTON */}
          <a
            href="#agenda"
            className="mt-9 inline-flex items-center gap-3 rounded-xl bg-emerald-500 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-950/20 transition duration-300 hover:-translate-y-1 hover:bg-emerald-400"
          >
            Temukan Agenda
            <ArrowRight size={18} />
          </a>

        </div>
      </section>

      {/* AGENDA */}
      <section id="agenda" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 lg:px-8">

        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              Temukan Agenda
              <span className="text-emerald-700"> Terbaru</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Jangan lewatkan kesempatan untuk belajar, berkolaborasi,
              dan berkontribusi bersama mahasiswa FAI.
            </p>
          </div>
        </div>

        {/* AGENDA SLIDER */}
        <AgendaSlider />
      </section>

      {/* ABOUT */}
      <section id="tentang" className="border-y border-emerald-50 bg-white py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-emerald-700">
              ABOUT THE PLATFORM
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
              Satu Link untuk
              <span className="text-emerald-700"> Semua Agenda.</span>
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              Agenda DEMA FAI hadir sebagai pusat informasi kegiatan
              mahasiswa. Seluruh agenda dapat ditemukan dalam satu
              platform, sehingga informasi kegiatan lebih mudah
              diakses dan dibagikan.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#102d1e] px-5 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold">AGENDA DEMA FAI</h3>
                  <p className="text-[10px] tracking-widest text-emerald-100/60">
                    EVENT INFORMATION CENTER
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-md text-sm leading-7 text-emerald-50/60">
                Pusat informasi agenda dan kegiatan Dewan Eksekutif
                Mahasiswa Fakultas Agama Islam.
              </p>
            </div>

            <div className="md:text-right">
              <h4 className="font-bold">Jelajahi</h4>
              <div className="mt-5 flex flex-col gap-3 text-sm text-emerald-50/60 md:items-end">
                <a href="#agenda" className="transition hover:text-white">Daftar Agenda</a>
                <a href="#tentang" className="transition hover:text-white">Tentang Platform</a>
                <a href="https://aspirasi.demafaiuika.my.id" className="transition hover:text-white">Aspirasi</a>
              </div>
              <div className="mt-6 flex gap-4 md:justify-end">
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-7 text-center text-xs text-emerald-100/40">
            © 2026 DEMA FAI. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
