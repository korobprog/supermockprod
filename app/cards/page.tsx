import { interviewCardRepository, initDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { CardFilters } from "@/components/card-filters";
import { CardList } from "@/components/card-list";

// Отключаем статическую генерацию для этой страницы
export const dynamic = 'force-dynamic';

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ techStack?: string; status?: string }>;
}) {
  try {
    await initDB();
    const user = await getCurrentUser(); // Не требует авторизации
    const params = await searchParams;
    const techStackFilter = params.techStack;
    const statusFilter = params.status;

    const cardRepo = await interviewCardRepository();
    let query = cardRepo.createQueryBuilder("card")
      .leftJoinAndSelect("card.user", "user")
      .leftJoinAndSelect("card.applications", "applications")
      .orderBy("card.createdAt", "DESC");

    if (techStackFilter) {
      query = query.where(":techStack = ANY(string_to_array(card.techStack, ','))")
        .setParameter("techStack", techStackFilter);
    }

    if (statusFilter) {
      if (techStackFilter) {
        query = query.andWhere("card.status = :status")
          .setParameter("status", statusFilter);
      } else {
        query = query.where("card.status = :status")
          .setParameter("status", statusFilter);
      }
    }

    const cards = await query.getMany();

    // Получаем все уникальные технологии для фильтра
    let allTechStack: string[] = [];
    try {
      const allCards = await cardRepo.find({
        select: ["techStack"],
      });

      allTechStack = Array.from(
        new Set(allCards.flatMap((card) => card.techStack || []))
      ).sort();
    } catch (error) {
      console.error("Error fetching tech stack for filters:", error);
      // Continue with empty array if this fails
    }

    // Преобразуем TypeORM сущности в простые объекты для передачи в Client Component
    const plainCards = JSON.parse(JSON.stringify(cards));

    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <Navbar />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Карточки собеседований
              </span>
            </h1>
            {user && (
              <Link
                href="/cards/new"
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl hover:from-indigo-400 hover:to-cyan-400 transition-all shadow-lg shadow-indigo-500/25"
              >
                Создать карточку
              </Link>
            )}
          </div>

          <CardFilters allTechStack={allTechStack} currentFilters={params} />

          <CardList cards={plainCards} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in CardsPage:", error);
    
    // Return error page instead of crashing
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <Navbar />
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Ошибка загрузки карточек
            </h1>
            <p className="text-red-300">
              Произошла ошибка при загрузке карточек собеседований. Пожалуйста, попробуйте обновить страницу.
            </p>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-4 text-xs text-red-200 overflow-auto">
                {error instanceof Error ? error.message : String(error)}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }
}

