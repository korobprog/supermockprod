import { NextResponse } from "next/server";
import { requireAuthApi, getCurrentUser } from "@/lib/auth-helpers";
import { getDataSource, tableToEntityMap, initDB, CardStatus } from "@/lib/db";
import { z } from "zod";
import { randomUUID } from "crypto";

const createCardSchema = z.object({
  profession: z.string().min(1),
  techStack: z.array(z.string()).min(1),
  scheduledAt: z.string().datetime(),
});

export async function GET(request: Request) {
  try {
    await initDB();
    const { searchParams } = new URL(request.url);
    const techStackFilter = searchParams.get("techStack");
    const statusFilter = searchParams.get("status");

    const dataSource = getDataSource();
    // Используем getRepository с явным указанием entity из tableToEntityMap
    const cardRepo = dataSource.getRepository(tableToEntityMap["interview_cards"]);
    let query = cardRepo.createQueryBuilder("card")
      .leftJoinAndSelect("card.user", "user")
      .leftJoinAndSelect("card.applications", "applications")
      .orderBy("card.createdAt", "DESC");

    if (techStackFilter) {
      // Используем LIKE для поиска в simple-array поле (хранится как строка с запятыми)
      // Ищем точное совпадение с учетом разделителей
      query = query.where(
        "(card.techStack = :techStack OR card.techStack LIKE :techStackStart OR card.techStack LIKE :techStackMiddle OR card.techStack LIKE :techStackEnd)",
        { 
          techStack: techStackFilter,
          techStackStart: `${techStackFilter},%`,
          techStackMiddle: `%,${techStackFilter},%`,
          techStackEnd: `%,${techStackFilter}`
        }
      );
    }

    if (statusFilter) {
      if (techStackFilter) {
        query = query.andWhere("card.status = :status", { status: statusFilter });
      } else {
        query = query.where("card.status = :status", { status: statusFilter });
      }
    }

    const cards = await query.getMany();

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json(
      { error: "Ошибка при получении карточек" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAuthApi();
    if (authError) {
      return authError;
    }
    const user = await getCurrentUser();
    const body = await request.json();
    const validatedData = createCardSchema.parse(body);

    // Проверяем лимиты
    const { checkInterviewLimit, useInterview } = await import("@/lib/points");
    const limitCheck = await checkInterviewLimit((user as any).id);

    if (!limitCheck.canCreate) {
      return NextResponse.json(
        { error: "Достигнут лимит бесплатных собеседований. Необходима подписка." },
        { status: 403 }
      );
    }

    await initDB();
    const dataSource = getDataSource();
    // Используем getRepository с явным указанием entity из tableToEntityMap
    const cardRepo = dataSource.getRepository(tableToEntityMap["interview_cards"]);
    const card = cardRepo.create({
      id: randomUUID(),
      userId: (user as any).id,
      profession: validatedData.profession,
      techStack: validatedData.techStack,
      scheduledAt: new Date(validatedData.scheduledAt),
    });

    await cardRepo.save(card);
    // Используем QueryBuilder для избежания проблем с минификацией
    const savedCard = await cardRepo
      .createQueryBuilder("card")
      .leftJoinAndSelect("card.user", "user")
      .where("card.id = :id", { id: card.id })
      .getOne();

    // Используем одно собеседование (не блокируем создание карточки при ошибке)
    try {
      await useInterview((user as any).id);
    } catch (error) {
      // Логируем ошибку, но не прерываем создание карточки
      console.error("Error in useInterview (non-blocking):", error);
    }

    return NextResponse.json(savedCard, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные данные", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating card:", error);
    return NextResponse.json(
      { error: "Ошибка при создании карточки" },
      { status: 500 }
    );
  }
}

