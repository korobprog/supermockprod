import "reflect-metadata";
import { requireAuth } from "@/lib/auth-helpers";
import { userRepository, SubscriptionStatus, initDB } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireAuth();
  await initDB();

  const userRepo = await userRepository();
  const userData = await userRepo.findOne({
    where: { id: (user as any).id },
    relations: ["interviewCards", "applications", "applications.card", "applications.card.user", "subscriptions"],
  });

  if (userData) {
    userData.interviewCards = userData.interviewCards
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
    userData.applications = userData.applications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
    userData.subscriptions = userData.subscriptions
      .filter((sub) => sub.status === SubscriptionStatus.ACTIVE && sub.endDate >= new Date())
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())
      .slice(0, 1);
  }

  const hasActiveSubscription = (userData?.subscriptions.length || 0) > 0;
  const freeInterviewsLeft = Math.max(0, 3 - (userData?.freeInterviewsUsed || 0));

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Личный кабинет
          </span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Баллы</h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              {userData?.points || 0}
            </p>
          </div>
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Бесплатных собеседований</h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {freeInterviewsLeft}
            </p>
          </div>
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Подписка</h3>
            <p className="text-lg font-bold">
              {hasActiveSubscription ? (
                <span className="text-emerald-400">Активна</span>
              ) : (
                <span className="text-slate-500">Неактивна</span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl border border-white/10 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Мои карточки</h2>
              <Link
                href="/cards/new"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg hover:from-indigo-400 hover:to-cyan-400 transition-all shadow-lg shadow-indigo-500/25"
              >
                Создать карточку
              </Link>
            </div>
            {userData?.interviewCards.length === 0 ? (
              <p className="text-slate-500">У вас пока нет карточек</p>
            ) : (
              <ul className="space-y-3">
                {userData?.interviewCards.map((card) => (
                  <li key={card.id} className="border-b border-white/5 pb-3 last:border-0">
                    <Link href={`/cards/${card.id}`} className="group block">
                      <p className="font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
                        {card.profession}
                      </p>
                      <p className="text-sm text-slate-400">
                        {new Date(card.scheduledAt).toLocaleString("ru-RU")}
                      </p>
                      <p className="text-sm text-slate-500">
                        Статус: <span className={
                          card.status === 'OPEN' ? 'text-emerald-400' :
                            card.status === 'COMPLETED' ? 'text-slate-400' : 'text-indigo-400'
                        }>{card.status}</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass rounded-2xl border border-white/10 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Мои отклики</h2>
              <Link
                href="/feedback"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Все фидбеки
              </Link>
            </div>
            {userData?.applications.length === 0 ? (
              <p className="text-slate-500">У вас пока нет откликов</p>
            ) : (
              <ul className="space-y-3">
                {userData?.applications.map((app) => (
                  <li key={app.id} className="border-b border-white/5 pb-3 last:border-0">
                    <Link href={`/cards/${app.cardId}`} className="group block">
                      <p className="font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
                        {app.card.profession}
                      </p>
                      <p className="text-sm text-slate-400">
                        Создатель: {app.card.user.name || app.card.user.email}
                      </p>
                      <p className="text-sm text-slate-500">
                        Статус: <span className={
                          app.status === 'ACCEPTED' ? 'text-emerald-400' :
                            app.status === 'PENDING' ? 'text-amber-400' : 'text-slate-400'
                        }>{app.status}</span>
                      </p>
                    </Link>
                    {app.status === "ACCEPTED" && (
                      <Link
                        href={`/applications/${app.id}/feedback`}
                        className="mt-3 inline-block px-3 py-1.5 text-sm font-medium text-white bg-indigo-500/20 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/30 transition-colors"
                      >
                        Оставить фидбек
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

