"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { safeJsonParse } from "@/lib/fetch-utils";

export default function FeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  const [formData, setFormData] = useState({
    toUserId: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<any>(null);

  useEffect(() => {
    if (applicationId) {
      fetchApplication(applicationId);
    }
  }, [applicationId]);

  const fetchApplication = async (id: string) => {
    try {
      const response = await fetch(`/api/applications/${id}`);
      if (response.ok) {
        const app = await safeJsonParse(response);
        setApplication(app);
        // Определяем, кому оставляем фидбек
        const sessionResponse = await fetch("/api/auth/session");
        if (sessionResponse.ok) {
          const session = await safeJsonParse(sessionResponse);
          const currentUserId = session.user?.id;
          if (currentUserId === app.card.userId) {
            setFormData((prev) => ({ ...prev, toUserId: app.applicant.id }));
          } else {
            setFormData((prev) => ({ ...prev, toUserId: app.card.user.id }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching application:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.message.trim()) {
      setError("Введите текст фидбека");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          toUserId: formData.toUserId,
          message: formData.message,
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        setError(data.error || "Ошибка при создании фидбека");
        return;
      }

      // Обновляем статус заявки на COMPLETED
      await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
        }),
      });

      router.push("/dashboard");
    } catch (err) {
      setError("Произошла ошибка при создании фидбека");
    } finally {
      setLoading(false);
    }
  };

  if (!application) {
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

  const targetUser =
    formData.toUserId === application.applicant.id
      ? application.applicant
      : application.card.user;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <Navbar />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Оставить фидбек
          </span>
        </h1>

        <div className="glass rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Собеседование: {application.card.profession}
          </h2>
          <p className="text-sm text-slate-400">
            Фидбек для: <span className="text-slate-300">{targetUser.name || targetUser.email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/10 p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
              Фидбек
            </label>
            <textarea
              id="message"
              rows={6}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
              placeholder="Опишите, над чем стоит поработать, что было хорошо, что можно улучшить..."
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
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-500 rounded-xl hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Отправить фидбек"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

