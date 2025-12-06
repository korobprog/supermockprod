"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";

export default function NewCardPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    profession: "",
    techStack: [] as string[],
    scheduledAt: "",
  });
  const [techInput, setTechInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addTech = () => {
    if (techInput.trim() && !formData.techStack.includes(techInput.trim())) {
      setFormData({
        ...formData,
        techStack: [...formData.techStack, techInput.trim()],
      });
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setFormData({
      ...formData,
      techStack: formData.techStack.filter((t) => t !== tech),
    });
  };

  const [limitInfo, setLimitInfo] = useState<{
    canCreate: boolean;
    freeInterviewsLeft: number;
    hasActiveSubscription: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/user/limits")
      .then((res) => res.json())
      .then((data) => setLimitInfo(data))
      .catch(() => { });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.profession) {
      setError("Укажите профессию");
      return;
    }

    if (formData.techStack.length === 0) {
      setError("Добавьте хотя бы одну технологию");
      return;
    }

    if (!formData.scheduledAt) {
      setError("Укажите дату и время");
      return;
    }

    if (limitInfo && !limitInfo.canCreate) {
      setError("Достигнут лимит бесплатных собеседований. Необходима подписка.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession: formData.profession,
          techStack: formData.techStack,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при создании карточки");
        return;
      }

      router.push(`/cards/${data.id}`);
    } catch (err) {
      setError("Произошла ошибка при создании карточки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <Navbar />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Создать карточку собеседования
          </span>
        </h1>

        {limitInfo && (
          <div className="bg-indigo-500/10 border border-indigo-500/50 text-indigo-300 px-4 py-3 rounded-xl mb-6">
            {limitInfo.hasActiveSubscription ? (
              <p>У вас активная подписка</p>
            ) : (
              <p>
                Бесплатных собеседований осталось: {limitInfo.freeInterviewsLeft} из 3
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/10 p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="profession" className="block text-sm font-medium text-slate-300 mb-2">
              Профессия
            </label>
            <input
              id="profession"
              type="text"
              required
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
              placeholder="Например: Frontend Developer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Стек технологий
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTech();
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                placeholder="Добавить технологию"
              />
              <button
                type="button"
                onClick={addTech}
                className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-500 rounded-xl hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Добавить
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTech(tech)}
                    className="ml-2 text-indigo-400 hover:text-indigo-200 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="scheduledAt" className="block text-sm font-medium text-slate-300 mb-2">
              Дата и время собеседования
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
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl hover:from-indigo-400 hover:to-cyan-400 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              {loading ? "Создание..." : "Создать карточку"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

