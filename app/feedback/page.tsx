import { requireAuth } from "@/lib/auth-helpers";
import { feedbackRepository } from "@/lib/db";
import { Navbar } from "@/components/navbar";

export default async function FeedbackPage() {
  const user = await requireAuth();
  const feedbackRepo = await feedbackRepository();

  const feedbacks = await feedbackRepo.find({
    where: {
      toUserId: (user as any).id,
    },
    relations: ["fromUser", "application", "application.card"],
    order: {
      createdAt: "DESC",
    },
  });

  // Преобразуем TypeORM сущности в простые объекты
  const plainFeedbacks = JSON.parse(JSON.stringify(feedbacks));

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <Navbar />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Мои фидбеки
          </span>
        </h1>

        {plainFeedbacks.length === 0 ? (
          <div className="glass rounded-2xl border border-white/10 p-8 text-center">
            <p className="text-slate-500">У вас пока нет фидбеков</p>
          </div>
        ) : (
          <div className="space-y-6">
            {plainFeedbacks.map((feedback: any) => (
              <div key={feedback.id} className="glass rounded-2xl border border-white/10 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-3">
                    {feedback.application.card.profession}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {feedback.application.card.techStack.map((tech: string) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-slate-400">
                      От: <span className="text-slate-300">{feedback.fromUser.name || feedback.fromUser.email}</span>
                    </p>
                    <p className="text-slate-500">
                      {new Date(feedback.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{feedback.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

