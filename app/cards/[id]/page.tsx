import { interviewCardRepository, initDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Navbar } from "@/components/navbar";
import { CardDetails } from "@/components/card-details";
import { notFound } from "next/navigation";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await initDB();
  const { id } = await params;
  const user = await getCurrentUser(); // Не требует авторизации, возвращает null если не авторизован

  const repo = await interviewCardRepository();
  const card = await repo.findOne({
    where: { id },
    relations: ["user", "applications", "applications.applicant"],
  });

  if (!card) {
    notFound();
  }

  const currentUserId = user ? (user as any).id : null;
  const isOwner = currentUserId ? card.userId === currentUserId : false;
  const hasApplication = currentUserId ? card.applications.some(
    (app) => app.applicantId === currentUserId
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
}

