import { NextResponse } from "next/server";
import { requireAuthApi, getCurrentUser } from "@/lib/auth-helpers";
import { applicationRepository, feedbackRepository } from "@/lib/db";
import { z } from "zod";
import { randomUUID } from "crypto";

const createFeedbackSchema = z.object({
  applicationId: z.string(),
  toUserId: z.string(),
  message: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const authError = await requireAuthApi();
    if (authError) {
      return authError;
    }
    const user = await getCurrentUser();
    const body = await request.json();
    const validatedData = createFeedbackSchema.parse(body);

    // Проверяем существование заявки
    const appRepo = await applicationRepository();
    const application = await appRepo.findOne({
      where: { id: validatedData.applicationId },
      relations: ["card"],
    });

    if (!application) {
      return NextResponse.json(
        { error: "Заявка не найдена" },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь участвует в этой заявке
    const isCardOwner = application.card.userId === (user as any).id;
    const isApplicant = application.applicantId === (user as any).id;

    if (!isCardOwner && !isApplicant) {
      return NextResponse.json(
        { error: "Вы не участвуете в этом собеседовании" },
        { status: 403 }
      );
    }

    // Проверяем, что фидбек оставляется правильному пользователю
    const targetUserId =
      isCardOwner && application.applicantId === validatedData.toUserId
        ? validatedData.toUserId
        : !isCardOwner && application.card.userId === validatedData.toUserId
        ? validatedData.toUserId
        : null;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Неверный получатель фидбека" },
        { status: 400 }
      );
    }

    // Проверяем, не оставлял ли уже пользователь фидбек для этой заявки
    const feedbackRepo = await feedbackRepository();
    const existingFeedback = await feedbackRepo.findOne({
      where: {
        applicationId: validatedData.applicationId,
        fromUserId: (user as any).id,
        toUserId: targetUserId,
      },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: "Вы уже оставили фидбек для этого собеседования" },
        { status: 400 }
      );
    }

    const feedback = feedbackRepo.create({
      id: randomUUID(),
      applicationId: validatedData.applicationId,
      fromUserId: (user as any).id,
      toUserId: targetUserId,
      message: validatedData.message,
    });

    await feedbackRepo.save(feedback);
    const savedFeedback = await feedbackRepo.findOne({
      where: { id: feedback.id },
      relations: ["fromUser", "toUser", "application", "application.card"],
    });

    // Проверяем, можно ли начислить баллы (оба фидбека оставлены)
    const { awardPointsForCompletedInterview } = await import("@/lib/points");
    await awardPointsForCompletedInterview(validatedData.applicationId);

    return NextResponse.json(savedFeedback, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные данные", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Ошибка при создании фидбека" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const applicationId = searchParams.get("applicationId");
    const feedbackRepo = await feedbackRepository();
    let query = feedbackRepo.createQueryBuilder("feedback")
      .leftJoinAndSelect("feedback.fromUser", "fromUser")
      .leftJoinAndSelect("feedback.toUser", "toUser")
      .leftJoinAndSelect("feedback.application", "application")
      .leftJoinAndSelect("application.card", "card")
      .orderBy("feedback.createdAt", "DESC");

    if (userId) {
      query = query.where("feedback.toUserId = :userId", { userId });
    }
    if (applicationId) {
      if (userId) {
        query = query.andWhere("feedback.applicationId = :applicationId", { applicationId });
      } else {
        query = query.where("feedback.applicationId = :applicationId", { applicationId });
      }
    }

    const feedbacks = await query.getMany();

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { error: "Ошибка при получении фидбеков" },
      { status: 500 }
    );
  }
}

