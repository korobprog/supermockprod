"use client";

import Link from "next/link";

interface Card {
  id: string;
  profession: string;
  techStack: string[];
  scheduledAt: string | Date;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  applications: Array<{
    id: string;
    status: string;
  }>;
}

interface CardListProps {
  cards: Card[];
}

export function CardList({ cards }: CardListProps) {
  if (cards.length === 0) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-8 text-center">
        <p className="text-slate-500">Карточки не найдены</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/cards/${card.id}`}
          className="group glass rounded-2xl border border-white/10 p-6 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300"
        >
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">
            {card.profession}
          </h3>
          <div className="mb-4">
            <p className="text-sm text-slate-400 mb-2">Технологии:</p>
            <div className="flex flex-wrap gap-2">
              {card.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-400">
              <span className="text-slate-500">Дата:</span>{" "}
              {new Date(card.scheduledAt).toLocaleString("ru-RU")}
            </p>
            <p className="text-sm text-slate-400">
              <span className="text-slate-500">Создатель:</span>{" "}
              {card.user.name || card.user.email}
            </p>
            <p className="text-sm text-slate-400">
              <span className="text-slate-500">Статус:</span>{" "}
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
            <p className="text-sm text-slate-400">
              <span className="text-slate-500">Откликов:</span>{" "}
              {card.applications.length}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

