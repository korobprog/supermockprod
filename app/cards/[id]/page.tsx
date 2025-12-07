import { getDataSource, tableToEntityMap, initDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Navbar } from "@/components/navbar";
import { CardDetails } from "@/components/card-details";
import { notFound } from "next/navigation";

// Отключаем статическую генерацию для этой страницы
export const dynamic = 'force-dynamic';

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await initDB();
    const { id } = await params;
    const user = await getCurrentUser(); // Не требует авторизации, возвращает null если не авторизован

    const dataSource = getDataSource();
    // Используем getRepository с явным указанием entity из tableToEntityMap
    const repo = dataSource.getRepository(tableToEntityMap["interview_cards"]);
    // Используем QueryBuilder для избежания проблем с минификацией
    const card = await repo
      .createQueryBuilder("card")
      .leftJoinAndSelect("card.user", "user")
      .leftJoinAndSelect("card.applications", "applications")
      .leftJoinAndSelect("applications.applicant", "applicant")
      .where("card.id = :id", { id })
      .getOne();

    if (!card) {
      notFound();
    }

    const currentUserId = user ? (user as any).id : null;
    const isOwner = currentUserId ? card.userId === currentUserId : false;
    const hasApplication = currentUserId && card.applications ? card.applications.some(
      (app: any) => app.applicantId === currentUserId
    ) : false;

    // Преобразуем TypeORM сущность в простой объект для передачи в Client Component
    const plainCard = JSON.parse(JSON.stringify(card));

    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <Navbar />
        <div className="max-w-4xl mx-auto">
          <CardDetails
            card={plainCard}
            currentUserId={currentUserId}
            isOwner={isOwner}
            hasApplication={hasApplication}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in CardDetailPage:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Return error page instead of crashing
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <Navbar />
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Ошибка загрузки карточки
            </h1>
            <p className="text-red-300">
              Произошла ошибка при загрузке карточки собеседования. Пожалуйста, попробуйте обновить страницу.
            </p>
            {(process.env.NODE_ENV === "development" || process.env.NODE_ENV !== "production") && (
              <pre className="mt-4 text-xs text-red-200 overflow-auto">
                {error instanceof Error ? error.message : String(error)}
                {error instanceof Error && error.stack && (
                  <div className="mt-2 text-xs opacity-75">
                    {error.stack}
                  </div>
                )}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }
}

