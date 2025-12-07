import { NextResponse } from "next/server";
import { requireAuthApi, getCurrentUser } from "@/lib/auth-helpers";
import { getDataSource, tableToEntityMap, initDB, ApplicationStatus } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await initDB();
    const dataSource = getDataSource();
    const appRepo = dataSource.getRepository(tableToEntityMap["applications"]);
    const application = await appRepo
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.card", "card")
      .leftJoinAndSelect("card.user", "user")
      .leftJoinAndSelect("application.applicant", "applicant")
      .where("application.id = :id", { id })
      .getOne();

    if (!application) {
      return NextResponse.json(
        { error: "Отклик не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Ошибка при получении отклика" },
      { status: 500 }
    );
  }
}

import { z } from "zod";

const updateApplicationSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(["PENDING", "ACCEPTED", "COMPLETED", "CANCELLED"]).optional(),
});

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
    const validatedData = updateApplicationSchema.parse(body);
    await initDB();
    const dataSource = getDataSource();
    const appRepo = dataSource.getRepository(tableToEntityMap["applications"]);
    // Используем QueryBuilder для избежания проблем с минификацией
    const application = await appRepo
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.card", "card")
      .where("application.id = :id", { id })
      .getOne();

    if (!application) {
      return NextResponse.json(
        { error: "Отклик не найден" },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    const isOwner = application.card.userId === (user as any).id;
    const isApplicant = application.applicantId === (user as any).id;
    const isAdmin = (user as any).role === "ADMIN";

    if (!isOwner && !isApplicant && !isAdmin) {
      return NextResponse.json(
        { error: "Нет доступа к редактированию этого отклика" },
        { status: 403 }
      );
    }

    // Только создатель карточки может принять отклик
    if (validatedData.status === ApplicationStatus.ACCEPTED && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Только создатель карточки может принять отклик" },
        { status: 403 }
      );
    }

    if (validatedData.scheduledAt) {
      application.scheduledAt = new Date(validatedData.scheduledAt);
    }
    if (validatedData.status) {
      application.status = validatedData.status as ApplicationStatus;
    }

    await appRepo.save(application);
    const updatedApplication = await appRepo
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.card", "card")
      .leftJoinAndSelect("card.user", "user")
      .leftJoinAndSelect("application.applicant", "applicant")
      .where("application.id = :id", { id })
      .getOne();

    return NextResponse.json(updatedApplication);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные данные", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении отклика" },
      { status: 500 }
    );
  }
}
