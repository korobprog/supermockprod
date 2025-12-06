"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCardFiltersStore } from "@/lib/stores/card-filters-store";

interface CardFiltersProps {
  allTechStack: string[];
  currentFilters: { techStack?: string; status?: string };
}

export function CardFilters({ allTechStack, currentFilters }: CardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    selectedTech,
    selectedStatus,
    setSelectedTech,
    setSelectedStatus,
    clearFilters: clearStoreFilters
  } = useCardFiltersStore();

  // Синхронизируем store с URL параметрами при монтировании
  useEffect(() => {
    if (currentFilters.techStack) {
      setSelectedTech(currentFilters.techStack);
    }
    if (currentFilters.status) {
      setSelectedStatus(currentFilters.status);
    }
  }, [currentFilters.techStack, currentFilters.status, setSelectedTech, setSelectedStatus]);

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (selectedTech) params.set("techStack", selectedTech);
    if (selectedStatus) params.set("status", selectedStatus);
    router.push(`/cards?${params.toString()}`);
  };

  const clearFilters = () => {
    clearStoreFilters();
    router.push("/cards");
  };

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Технология
          </label>
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          >
            <option value="" className="bg-slate-900 text-slate-300">Все технологии</option>
            {allTechStack.map((tech) => (
              <option key={tech} value={tech} className="bg-slate-900 text-slate-300">
                {tech}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Статус
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          >
            <option value="" className="bg-slate-900 text-slate-300">Все статусы</option>
            <option value="OPEN" className="bg-slate-900 text-slate-300">Открыта</option>
            <option value="IN_PROGRESS" className="bg-slate-900 text-slate-300">В процессе</option>
            <option value="COMPLETED" className="bg-slate-900 text-slate-300">Завершена</option>
            <option value="CANCELLED" className="bg-slate-900 text-slate-300">Отменена</option>
          </select>
        </div>
        <div className="flex items-end space-x-3">
          <button
            onClick={handleFilter}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-500 rounded-xl hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
          >
            Применить
          </button>
          <button
            onClick={clearFilters}
            className="px-6 py-2.5 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            Сбросить
          </button>
        </div>
      </div>
    </div>
  );
}

