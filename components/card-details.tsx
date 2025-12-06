"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AddToCalendar } from "@/components/add-to-calendar";

interface CardDetailsProps {
  card: {
    id: string;
    profession: string;
    techStack: string[];
    scheduledAt: string | Date;
    status: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
    applications: Array<{
      id: string;
      applicantId: string;
      scheduledAt: string | Date | null;
      status: string;
      applicant: {
        id: string;
        name: string | null;
        email: string;
      };
    }>;
  };
  currentUserId: string | null;
  isOwner: boolean;
  hasApplication: boolean;
}

export function CardDetails({ card, currentUserId, isOwner, hasApplication }: CardDetailsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleApplyClick = (e: React.MouseEvent) => {
    if (!session || !session.user) {
      e.preventDefault();
      const shouldLogin = confirm("Для участия в собеседовании необходимо авторизоваться. Перейти на страницу входа?");
      if (shouldLogin) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/cards/${card.id}`)}`);
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить эту карточку?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/cards");
      } else {
        alert("Ошибка при удалении карточки");
      }
    } catch (error) {
      alert("Ошибка при удалении карточки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl border border-white/10 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">{card.profession}</h1>
        <div className="flex flex-wrap gap-2 mb-6">
          {card.techStack.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 text-sm font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg"
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-slate-400">
            <span className="font-medium text-slate-300">Дата и время:</span>{" "}
            {new Date(card.scheduledAt).toLocaleString("ru-RU")}
          </p>
          <div className="mt-2">
            <AddToCalendar
              title={`Собеседование: ${card.profession}`}
              description={`Стек: ${card.techStack.join(", ")}`}
              startDate={card.scheduledAt}
            />
          </div>
          <p className="text-slate-400">
            <span className="font-medium text-slate-300">Создатель:</span> {card.user.name || card.user.email}
          </p>
          <p className="text-slate-400">
            <span className="font-medium text-slate-300">Статус:</span>{" "}
            <span
              className={`font-medium ${card.status === "OPEN"
                ? "text-emerald-400"
                : card.status === "IN_PROGRESS"
                  ? "text-blue-400"
                  : card.status === "COMPLETED"
                    ? "text-slate-400"
                    : "text-red-400"
                }`}
            >
              {card.status === "OPEN"
                ? "Открыта"
                : card.status === "IN_PROGRESS"
                  ? "В процессе"
                  : card.status === "COMPLETED"
                    ? "Завершена"
                    : "Отменена"}
            </span>
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="mb-8 flex space-x-4">
          <Link
            href={`/cards/${card.id}/edit`}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-500 rounded-xl hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
          >
            Редактировать
          </Link>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-red-500/80 rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Удаление..." : "Удалить"}
          </button>
        </div>
      )}

      {!isOwner && !hasApplication && card.status === "OPEN" && (
        <div className="mb-8">
          <Link
            href={session?.user ? `/cards/${card.id}/apply` : "#"}
            onClick={handleApplyClick}
            className="inline-block px-6 py-3 text-sm font-medium text-white bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Откликнуться
          </Link>
        </div>
      )}

      {isOwner && card.applications.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Действия с откликами:</h3>
          {card.applications
            .filter((app) => app.status === "PENDING")
            .map((app) => (
              <div key={app.id} className="mb-3">
                <Link
                  href={`/cards/${card.id}/accept/${app.id}`}
                  className="inline-block px-4 py-2 text-sm font-medium text-white bg-emerald-500/80 rounded-lg hover:bg-emerald-500 mr-2 transition-colors"
                >
                  Принять отклик от {app.applicant.name || app.applicant.email}
                </Link>
              </div>
            ))}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-white mb-6">Отклики ({card.applications.length})</h2>
        {card.applications.length === 0 ? (
          <p className="text-slate-500">Пока нет откликов</p>
        ) : (
          <div className="space-y-4">
            {card.applications.map((app) => (
              <div key={app.id} className="glass border border-white/5 rounded-xl p-6">
                <p className="font-medium text-slate-200 mb-2">
                  {app.applicant.name || app.applicant.email}
                </p>
                <p className="text-sm text-slate-400 mb-1">
                  Статус:{" "}
                  <span
                    className={`font-medium ${app.status === "PENDING"
                      ? "text-amber-400"
                      : app.status === "ACCEPTED"
                        ? "text-emerald-400"
                        : app.status === "COMPLETED"
                          ? "text-blue-400"
                          : "text-red-400"
                      }`}
                  >
                    {app.status === "PENDING"
                      ? "Ожидает подтверждения"
                      : app.status === "ACCEPTED"
                        ? "Принят"
                        : app.status === "COMPLETED"
                          ? "Завершен"
                          : "Отменен"}
                  </span>
                </p>
                {app.scheduledAt && (
                  <>
                    <p className="text-sm text-slate-400">
                      Время ответного собеседования:{" "}
                      {new Date(app.scheduledAt).toLocaleString("ru-RU")}
                    </p>
                    <div className="mt-2">
                      <AddToCalendar
                        title={`Ответное собеседование: ${app.applicant.name || app.applicant.email}`}
                        description={`Кандидат: ${app.applicant.name || app.applicant.email}`}
                        startDate={app.scheduledAt}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

