import { NextResponse } from "next/server";
import { requireAuthApi, getCurrentUser } from "@/lib/auth-helpers";
import { userRepository, subscriptionRepository, SubscriptionStatus } from "@/lib/db";
import { z } from "zod";
import { randomUUID } from "crypto";

const createSubscriptionSchema = z.object({
  weeks: z.number().int().min(1).max(52),
});

export async function POST(request: Request) {
  try {
    const authError = await requireAuthApi();
    if (authError) {
      return authError;
    }
    const user = await getCurrentUser();
    const body = await request.json();
    const validatedData = createSubscriptionSchema.parse(body);

    // Проверяем баланс пользователя
    const userRepo = await userRepository();
    const userData = await userRepo.findOne({
      where: { id: (user as any).id },
    });

    if (!userData) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const cost = validatedData.weeks * 100; // 100 рублей за неделю

    if (userData.points < cost) {
      return NextResponse.json(
        { error: "Недостаточно баллов для покупки подписки" },
        { status: 400 }
      );
    }

    // Создаем подписку
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + validatedData.weeks * 7);
    const subRepo = await subscriptionRepository();

    const subscription = subRepo.create({
      id: randomUUID(),
      userId: (user as any).id,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
    });

    await subRepo.save(subscription);

    // Списываем баллы
    userData.points -= cost;
    await userRepo.save(userData);

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные данные", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Ошибка при создании подписки" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authError = await requireAuthApi();
    if (authError) {
      return authError;
    }
    const user = await getCurrentUser();
    const subRepo = await subscriptionRepository();

    const subscriptions = await subRepo.find({
      where: {
        userId: (user as any).id,
      },
      order: {
        createdAt: "DESC",
      },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Ошибка при получении подписок" },
      { status: 500 }
    );
  }
}

