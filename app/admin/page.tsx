import { requireAdmin, isVirtualAdmin } from "@/lib/auth-helpers";
import { paymentRepository, userRepository, interviewCardRepository, applicationRepository, PaymentStatus } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { AdminPanel } from "@/components/admin-panel";

// Отключаем статическую генерацию для этой страницы
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await requireAdmin();

  // Проверяем, является ли это виртуальным админом
  const isVirtual = isVirtualAdmin((admin as any).id);

  let stats;
  let plainPayments;

  if (isVirtual) {
    // Для виртуального админа показываем пустую статистику
    stats = {
      totalUsers: 0,
      totalCards: 0,
      totalApplications: 0,
      totalPayments: 0,
      pendingPayments: 0,
    };
    plainPayments = [];
  } else {
    // Для обычного админа загружаем данные из БД
    const paymentRepo = await paymentRepository();
    const userRepo = await userRepository();
    const cardRepo = await interviewCardRepository();
    const appRepo = await applicationRepository();

    const payments = await paymentRepo.find({
      relations: ["user"],
      order: {
        createdAt: "DESC",
      },
    });

    stats = {
      totalUsers: await userRepo.count(),
      totalCards: await cardRepo.count(),
      totalApplications: await appRepo.count(),
      totalPayments: await paymentRepo.count(),
      pendingPayments: payments.filter((p) => p.status === PaymentStatus.PENDING).length,
    };

    // Преобразуем TypeORM сущности в простые объекты для передачи в Client Component
    plainPayments = JSON.parse(JSON.stringify(payments));
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Админ панель
          </span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="glass rounded-2xl border border-white/10 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Пользователей</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              {stats.totalUsers}
            </p>
          </div>
          <div className="glass rounded-2xl border border-white/10 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Карточек</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {stats.totalCards}
            </p>
          </div>
          <div className="glass rounded-2xl border border-white/10 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Откликов</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {stats.totalApplications}
            </p>
          </div>
          <div className="glass rounded-2xl border border-white/10 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Платежей</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {stats.totalPayments}
            </p>
          </div>
          <div className="glass rounded-2xl border border-white/10 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Ожидают</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
              {stats.pendingPayments}
            </p>
          </div>
        </div>

        <AdminPanel payments={plainPayments} />
      </div>
    </div>
  );
}

