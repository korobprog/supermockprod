"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProfileData {
    id: string;
    email: string;
    name: string | null;
    telegram: string | null;
    discord: string | null;
    whatsapp: string | null;
    role: string;
    points: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        telegram: "",
        discord: "",
        whatsapp: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/user/profile");
            if (!res.ok) {
                throw new Error("Не удалось загрузить профиль");
            }
            const data = await res.json();
            setProfile(data);
            setFormData({
                name: data.name || "",
                telegram: data.telegram || "",
                discord: data.discord || "",
                whatsapp: data.whatsapp || "",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Произошла ошибка");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name || null,
                    telegram: formData.telegram || null,
                    discord: formData.discord || null,
                    whatsapp: formData.whatsapp || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Ошибка при сохранении");
            }

            setSuccess("Профиль успешно обновлен!");
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Произошла ошибка");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="glass rounded-2xl p-8 text-center">
                        <div className="text-slate-400">Загрузка профиля...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад к личному кабинету
                    </Link>
                </div>

                <div className="glass rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Редактирование профиля</h1>
                            <p className="text-slate-400 text-sm">{profile?.email}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Имя */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                                Имя
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                                placeholder="Введите ваше имя"
                            />
                        </div>

                        {/* Telegram */}
                        <div>
                            <label htmlFor="telegram" className="block text-sm font-medium text-slate-300 mb-2">
                                Telegram
                            </label>
                            <input
                                type="text"
                                id="telegram"
                                value={formData.telegram}
                                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                                placeholder="@username или username"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Укажите ваш Telegram username (с @ или без)
                            </p>
                        </div>

                        {/* Discord */}
                        <div>
                            <label htmlFor="discord" className="block text-sm font-medium text-slate-300 mb-2">
                                Discord
                            </label>
                            <input
                                type="text"
                                id="discord"
                                value={formData.discord}
                                onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                                placeholder="username#1234"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Укажите ваш Discord username с тегом
                            </p>
                        </div>

                        {/* WhatsApp */}
                        <div>
                            <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-300 mb-2">
                                WhatsApp
                            </label>
                            <input
                                type="text"
                                id="whatsapp"
                                value={formData.whatsapp}
                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all"
                                placeholder="+79991234567"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Укажите номер телефона в международном формате
                            </p>
                        </div>

                        {/* Сообщения об ошибке/успехе */}
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg">
                                <p className="text-emerald-400 text-sm">{success}</p>
                            </div>
                        )}

                        {/* Кнопка сохранения */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-lg font-medium hover:from-indigo-400 hover:to-cyan-400 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? "Сохранение..." : "Сохранить изменения"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
