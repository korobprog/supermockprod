import { NextResponse } from "next/server";
import { requireAuthApi, getCurrentUser } from "@/lib/auth-helpers";
import { interviewCardRepository, applicationRepository, CardStatus } from "@/lib/db";
import { z } from "zod";
import { randomUUID } from "crypto";

const createApplicationSchema = z.object({
  cardId: z.string(),
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    const authError = await requireAuthApi();
    if (authError) {
      return authError;
    }
    const user = await getCurrentUser();
    const body = await request.json();
    const validatedData = createApplicationSchema.parse(body);

    // Проверяем существование карточки
    const cardRepo = await interviewCardRepository();
    const card = await cardRepo.findOne({
      where: { id: validatedData.cardId },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Карточка не найдена" },
        { status: 404 }
      );
    }

    if (card.userId === (user as any).id) {
      return NextResponse.json(
        { error: "Нельзя откликнуться на свою карточку" },
        { status: 400 }
      );
    }

    if (card.status !== CardStatus.OPEN) {
      return NextResponse.json(
        { error: "Карточка не принимает отклики" },
        { status: 400 }
      );
    }

    // Проверяем, нет ли уже отклика от этого пользователя
    const appRepo = await applicationRepository();
    const existingApplication = await appRepo.findOne({
      where: {
        cardId: validatedData.cardId,
        applicantId: (user as any).id,
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "Вы уже откликнулись на эту карточку" },
        { status: 400 }
      );
    }

    const application = appRepo.create({
      id: randomUUID(),
      cardId: validatedData.cardId,
      applicantId: (user as any).id,
      scheduledAt: validatedData.scheduledAt
        ? new Date(validatedData.scheduledAt)
        : null,
    });

    await appRepo.save(application);

    // Обновляем статус карточки на IN_PROGRESS
    card.status = CardStatus.IN_PROGRESS;
    await cardRepo.save(card);

    const savedApplication = await appRepo.findOne({
      where: { id: application.id },
      relations: ["card", "card.user", "applicant"],
    });

    return NextResponse.json(savedApplication, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные данные", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Ошибка при создании отклика" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const cardId = searchParams.get("cardId");
    const appRepo = await applicationRepository();
    let query = appRepo.createQueryBuilder("application")
      .leftJoinAndSelect("application.card", "card")
      .leftJoinAndSelect("card.user", "user")
      .leftJoinAndSelect("application.applicant", "applicant")
      .orderBy("application.createdAt", "DESC");

    if (userId) {
      query = query.where("application.applicantId = :userId", { userId });
    }
    if (cardId) {
      if (userId) {
        query = query.andWhere("application.cardId = :cardId", { cardId });
      } else {
        query = query.where("application.cardId = :cardId", { cardId });
      }
    }

    const applications = await query.getMany();

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Ошибка при получении откликов" },
      { status: 500 }
    );
  }
}

