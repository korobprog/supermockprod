"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const cardId = params.id as string;
  const [formData, setFormData] = useState({
    scheduledAt: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState<any>(null);

  useEffect(() => {
    // Проверяем авторизацию при загрузке страницы
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/cards/${cardId}/apply`)}`);
      return;
    }
    
    if (status === "authenticated" && cardId) {
      fetchCard(cardId);
    }
  }, [cardId, status, router]);

  const fetchCard = async (id: string) => {
    try {
      const response = await fetch(`/api/cards/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCard(data);
      }
    } catch (error) {
      console.error("Error fetching card:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.scheduledAt) {
      setError("Укажите дату и время для ответного собеседования");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при создании отклика");
        return;
      }

      router.push(`/cards/${cardId}`);
      router.refresh();
    } catch (err) {
      setError("Произошла ошибка при создании отклика");
    } finally {
      setLoading(false);
    }
  };

  // Показываем загрузку, если проверяем авторизацию или загружаем карточку
  if (status === "loading" || !card) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <Navbar />
        <div className="max-w-2xl mx-auto">
          <div className="glass rounded-2xl border border-white/10 p-8 text-center">
            <p className="text-slate-400">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <Navbar />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Откликнуться на карточку
          </span>
        </h1>

        <div className="glass rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">{card.profession}</h2>
          <div className="mb-4">
            <p className="text-sm text-slate-400 mb-2">Технологии:</p>
            <div className="flex flex-wrap gap-2">
              {card.techStack.map((tech: string) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Дата собеседования: <span className="text-slate-300">{new Date(card.scheduledAt).toLocaleString("ru-RU")}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/10 p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm text-slate-400 mb-4">
              Вы обязуетесь провести ответное собеседование по тому же стеку технологий.
              Выберите дату и время для ответного собеседования:
            </p>
            <label htmlFor="scheduledAt" className="block text-sm font-medium text-slate-300 mb-2">
              Дата и время ответного собеседования
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              required
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Откликнуться"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

