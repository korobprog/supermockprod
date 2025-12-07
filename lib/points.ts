import { getDataSource, tableToEntityMap, applicationRepository, SubscriptionStatus, initDB, UserRole } from "./db";
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
  const dataSource = getDataSource();
  // Используем getRepository с явным указанием entity из tableToEntityMap
  const userRepo = dataSource.getRepository(tableToEntityMap["users"]);
  // Используем QueryBuilder для избежания проблем с минификацией
  const user = await userRepo
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.subscriptions", "subscriptions")
    .where("user.id = :userId", { userId })
    .getOne();

  if (!user) {
    return { canCreate: false, freeInterviewsLeft: 0, hasActiveSubscription: false };
  }

  // Админы могут создавать неограниченное количество карточек
  if (user.role === UserRole.ADMIN) {
    return { canCreate: true, freeInterviewsLeft: Infinity, hasActiveSubscription: true };
  }

  const activeSubscriptions = user.subscriptions.filter(
    (sub: any) => sub.status === SubscriptionStatus.ACTIVE && sub.endDate >= new Date()
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

  try {
    await initDB();
    const dataSource = getDataSource();
    // Используем getRepository с явным указанием entity из tableToEntityMap
    const userRepo = dataSource.getRepository(tableToEntityMap["users"]);
    // Используем QueryBuilder для избежания проблем с минификацией
    const user = await userRepo
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.subscriptions", "subscriptions")
      .where("user.id = :userId", { userId })
      .getOne();

    if (!user) {
      // Если пользователь не найден, просто логируем и возвращаемся
      // Это может произойти для виртуального админа или если пользователь был удален
      console.warn(`User not found for useInterview: ${userId}`);
      return;
    }

    // Админы не тратят собеседования
    if (user.role === UserRole.ADMIN) {
      return;
    }

    const hasActiveSubscription = user.subscriptions.some(
      (sub: any) => sub.status === SubscriptionStatus.ACTIVE && sub.endDate >= new Date()
    );

    // Если нет активной подписки, увеличиваем счетчик бесплатных собеседований
    if (!hasActiveSubscription) {
      user.freeInterviewsUsed += 1;
      const dataSource = getDataSource();
      const userRepo = dataSource.getRepository(tableToEntityMap["users"]);
      await userRepo.save(user);
    }
  } catch (error) {
    // Логируем ошибку, но не прерываем создание карточки
    console.error("Error in useInterview:", error);
    // Не выбрасываем ошибку, чтобы не прервать создание карточки
  }
}

export async function awardPoints(userId: string, amount: number = POINTS_PER_INTERVIEW): Promise<void> {
  await initDB();
  const dataSource = getDataSource();
  const userRepo = dataSource.getRepository(tableToEntityMap["users"]);
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

