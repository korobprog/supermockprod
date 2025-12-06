"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";

export default function EditCardPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const cardId = params.id as string;
  
  const [formData, setFormData] = useState({
    profession: "",
    techStack: [] as string[],
    scheduledAt: "",
    status: "OPEN" as "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  });
  const [techInput, setTechInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    // Проверяем авторизацию при загрузке страницы
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/cards/${cardId}/edit`)}`);
      return;
    }
    
    if (status === "authenticated" && cardId) {
      fetchCard(cardId);
    }
  }, [cardId, status, router]);

  const fetchCard = async (id: string) => {
    try {
      const response = await fetch(`/api/cards/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Карточка не найдена");
        } else if (response.status === 403) {
          setError("У вас нет доступа к редактированию этой карточки");
        } else {
          setError("Ошибка при загрузке карточки");
        }
        setFetching(false);
        return;
      }

      const card = await response.json();
      
      // Проверяем, что пользователь является владельцем
      if (card.userId !== (session?.user as any)?.id && (session?.user as any)?.role !== "ADMIN") {
        setError("У вас нет доступа к редактированию этой карточки");
        setFetching(false);
        return;
      }

      // Форматируем дату для input datetime-local
      const scheduledDate = new Date(card.scheduledAt);
      const year = scheduledDate.getFullYear();
      const month = String(scheduledDate.getMonth() + 1).padStart(2, "0");
      const day = String(scheduledDate.getDate()).padStart(2, "0");
      const hours = String(scheduledDate.getHours()).padStart(2, "0");
      const minutes = String(scheduledDate.getMinutes()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

      setFormData({
        profession: card.profession || "",
        techStack: card.techStack || [],
        scheduledAt: formattedDate,
        status: card.status || "OPEN",
      });
    } catch (error) {
      console.error("Error fetching card:", error);
      setError("Ошибка при загрузке карточки");
    } finally {
      setFetching(false);
    }
  };

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

    setLoading(true);

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession: formData.profession,
          techStack: formData.techStack,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при обновлении карточки");
        return;
      }

      router.push(`/cards/${cardId}`);
    } catch (err) {
      setError("Произошла ошибка при обновлении карточки");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <Navbar />
        <div className="max-w-2xl mx-auto">
          <div className="text-center text-slate-400">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error && !formData.profession) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <Navbar />
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2.5 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            Назад
          </button>
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
            Редактировать карточку собеседования
          </span>
        </h1>

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

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">
              Статус
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
            >
              <option value="OPEN">Открыта</option>
              <option value="IN_PROGRESS">В процессе</option>
              <option value="COMPLETED">Завершена</option>
              <option value="CANCELLED">Отменена</option>
            </select>
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
              {loading ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

