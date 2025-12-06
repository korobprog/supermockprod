import { NextResponse } from "next/server";
import { requireAuthApi, getCurrentUser } from "@/lib/auth-helpers";
import { interviewCardRepository } from "@/lib/db";
import { z } from "zod";

const updateCardSchema = z.object({
  profession: z.string().min(1).optional(),
  techStack: z.array(z.string()).min(1).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repo = await interviewCardRepository();
    const card = await repo.findOne({
      where: { id },
      relations: ["user", "applications", "applications.applicant"],
    });

    if (!card) {
      return NextResponse.json(
        { error: "Карточка не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error fetching card:", error);
    return NextResponse.json(
      { error: "Ошибка при получении карточки" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuthApi();
    if (authError) {
      return authError;
    }
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCardSchema.parse(body);
    const repo = await interviewCardRepository();
    const card = await repo.findOne({
      where: { id },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Карточка не найдена" },
        { status: 404 }
      );
    }

    if (card.userId !== (user as any).id && (user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Нет доступа к редактированию этой карточки" },
        { status: 403 }
      );
    }

    if (validatedData.profession) card.profession = validatedData.profession;
    if (validatedData.techStack) card.techStack = validatedData.techStack;
    if (validatedData.scheduledAt) card.scheduledAt = new Date(validatedData.scheduledAt);
    if (validatedData.status) card.status = validatedData.status as any;

    await repo.save(card);
    const updatedCard = await repo.findOne({
      where: { id },
      relations: ["user"],
    });

    return NextResponse.json(updatedCard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные данные", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating card:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении карточки" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuthApi();
    if (authError) {
      return authError;
    }
    const user = await getCurrentUser();
    const { id } = await params;
    const repo = await interviewCardRepository();
    const card = await repo.findOne({
      where: { id },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Карточка не найдена" },
        { status: 404 }
      );
    }

    if (card.userId !== (user as any).id && (user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Нет доступа к удалению этой карточки" },
        { status: 403 }
      );
    }

    await repo.remove(card);

    return NextResponse.json({ message: "Карточка удалена" });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении карточки" },
      { status: 500 }
    );
  }
}

