import { userRepository, applicationRepository, SubscriptionStatus, initDB } from "./db";
import { isVirtualAdmin } from "./auth-helpers";

const FREE_INTERVIEWS_LIMIT = 3;
const POINTS_PER_INTERVIEW = 1;

export async function checkInterviewLimit(userId: string): Promise<{
  canCreate: boolean;
  freeInterviewsLeft: number;
  hasActiveSubscription: boolean;
}> {
  // Виртуальный админ может создавать неограниченное количество карточек
  if (isVirtualAdmin(userId)) {
    return { canCreate: true, freeInterviewsLeft: Infinity, hasActiveSubscription: true };
  }

  await initDB();
  const userRepo = await userRepository();
  const user = await userRepo.findOne({
    where: { id: userId },
    relations: ["subscriptions"],
  });

  if (!user) {
    return { canCreate: false, freeInterviewsLeft: 0, hasActiveSubscription: false };
  }

  const activeSubscriptions = user.subscriptions.filter(
    (sub) => sub.status === SubscriptionStatus.ACTIVE && sub.endDate >= new Date()
  );
  const hasActiveSubscription = activeSubscriptions.length > 0;
  const freeInterviewsLeft = Math.max(0, FREE_INTERVIEWS_LIMIT - user.freeInterviewsUsed);

  // Можно создать карточку, если есть активная подписка или остались бесплатные собеседования
  const canCreate = hasActiveSubscription || freeInterviewsLeft > 0;

  return { canCreate, freeInterviewsLeft, hasActiveSubscription };
}

export async function useInterview(userId: string): Promise<void> {
  // Виртуальный админ не тратит собеседования
  if (isVirtualAdmin(userId)) {
    return;
  }

  const userRepo = await userRepository();
  const user = await userRepo.findOne({
    where: { id: userId },
    relations: ["subscriptions"],
  });

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  const hasActiveSubscription = user.subscriptions.some(
    (sub) => sub.status === SubscriptionStatus.ACTIVE && sub.endDate >= new Date()
  );

  // Если нет активной подписки, увеличиваем счетчик бесплатных собеседований
  if (!hasActiveSubscription) {
    user.freeInterviewsUsed += 1;
    await userRepo.save(user);
  }
}

export async function awardPoints(userId: string, amount: number = POINTS_PER_INTERVIEW): Promise<void> {
  const userRepo = await userRepository();
  const user = await userRepo.findOne({ where: { id: userId } });
  if (user) {
    user.points += amount;
    await userRepo.save(user);
  }
}

export async function awardPointsForCompletedInterview(applicationId: string): Promise<void> {
  const appRepo = await applicationRepository();
  const application = await appRepo.findOne({
    where: { id: applicationId },
    relations: ["card", "feedbacks"],
  });

  if (!application || application.status !== "COMPLETED") {
    return;
  }

  // Проверяем, что оба участника оставили фидбек
  const feedbacks = application.feedbacks;
  if (feedbacks.length < 2) {
    return; // Не все фидбеки оставлены
  }

  // Начисляем баллы обоим участникам
  await awardPoints(application.card.userId);
  await awardPoints(application.applicantId);
}

