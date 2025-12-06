import { NextResponse } from "next/server";
import { requireAuthApi, getCurrentUser } from "@/lib/auth-helpers";
import { interviewCardRepository, CardStatus } from "@/lib/db";
import { z } from "zod";
import { randomUUID } from "crypto";

const createCardSchema = z.object({
  profession: z.string().min(1),
  techStack: z.array(z.string()).min(1),
  scheduledAt: z.string().datetime(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const techStackFilter = searchParams.get("techStack");
    const statusFilter = searchParams.get("status");

    const cardRepo = await interviewCardRepository();
    let query = cardRepo.createQueryBuilder("card")
      .leftJoinAndSelect("card.user", "user")
      .leftJoinAndSelect("card.applications", "applications")
      .orderBy("card.createdAt", "DESC");

    if (techStackFilter) {
      query = query.where(":techStack = ANY(string_to_array(card.techStack, ','))")
        .setParameter("techStack", techStackFilter);
    }

    if (statusFilter) {
      if (techStackFilter) {
        query = query.andWhere("card.status = :status")
          .setParameter("status", statusFilter);
      } else {
        query = query.where("card.status = :status")
          .setParameter("status", statusFilter);
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

    const cardRepo = await interviewCardRepository();
    const card = cardRepo.create({
      id: randomUUID(),
      userId: (user as any).id,
      profession: validatedData.profession,
      techStack: validatedData.techStack,
      scheduledAt: new Date(validatedData.scheduledAt),
    });

    await cardRepo.save(card);
    const savedCard = await cardRepo.findOne({
      where: { id: card.id },
      relations: ["user"],
    });

    // Используем одно собеседование
    await useInterview((user as any).id);

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

