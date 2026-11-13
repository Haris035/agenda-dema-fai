
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LockKeyhole, Mail, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const { data, error: loginError } =
                await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                });

            if (loginError || !data.user) {
                setError("Email atau password tidak valid.");
                return;
            }

            const { data: admin, error: adminError } = await supabase
                .from("admin_users")
                .select("user_id")
                .eq("user_id", data.user.id)
                .maybeSingle();

            if (adminError || !admin) {
                await supabase.auth.signOut();
                setError("Akun ini tidak memiliki akses sebagai admin.");
                return;
            }

            router.replace("/admin/dashboard");
            router.refresh();
        } catch {
            setError("Terjadi kesalahan. Silakan coba kembali.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-800 text-white shadow-lg shadow-green-900/20">
                        <LockKeyhole size={28} />
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Admin DEMA FAI
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Masuk untuk mengelola agenda kegiatan DEMA FAI UIKA Bogor.
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-8">
                    <h2 className="mb-6 text-lg font-semibold text-slate-900">
                        Login Administrator
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Email
                            </label>

                            <div className="relative">
                                <Mail
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@email.com"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-green-700 focus:bg-white focus:ring-4 focus:ring-green-700/10"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <LockKeyhole
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-green-700 focus:bg-white focus:ring-4 focus:ring-green-700/10"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Memeriksa akun...
                                </>
                            ) : (
                                "Masuk ke Dashboard"
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    DEMA FAI UIKA Bogor · Administrator Area
                </p>
            </div>
        </main>
    );
}
