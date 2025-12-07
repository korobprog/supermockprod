import { NextResponse } from "next/server";
import { requireAuthApi, getCurrentUser } from "@/lib/auth-helpers";
import { getDataSource, tableToEntityMap, initDB, PaymentStatus } from "@/lib/db";
import { z } from "zod";
import { randomUUID } from "crypto";

const createPaymentSchema = z.object({
  amount: z.number().int().min(1),
});

export async function POST(request: Request) {
  try {
    const authError = await requireAuthApi();
    if (authError) {
      return authError;
    }
    const user = await getCurrentUser();
    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);
    await initDB();
    const dataSource = getDataSource();
    const paymentRepo = dataSource.getRepository(tableToEntityMap["payments"]);

    const payment = paymentRepo.create({
      id: randomUUID(),
      userId: (user as any).id,
      amount: validatedData.amount,
      status: PaymentStatus.PENDING,
    });

    await paymentRepo.save(payment);
    // Используем QueryBuilder для избежания проблем с минификацией
    const savedPayment = await paymentRepo
      .createQueryBuilder("payment")
      .leftJoinAndSelect("payment.user", "user")
      .where("payment.id = :id", { id: payment.id })
      .getOne();

    return NextResponse.json(savedPayment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные данные", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Ошибка при создании заявки на пополнение" },
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    await initDB();
    const dataSource = getDataSource();
    const paymentRepo = dataSource.getRepository(tableToEntityMap["payments"]);

    let query = paymentRepo.createQueryBuilder("payment")
      .leftJoinAndSelect("payment.user", "user")
      .orderBy("payment.createdAt", "DESC");

    // Админ видит все платежи, обычный пользователь - только свои
    if ((user as any).role !== "ADMIN") {
      query = query.where("payment.userId = :userId", { userId: (user as any).id });
    } else {
      if (userId) {
        query = query.where("payment.userId = :userId", { userId });
      }
    }

    if (status) {
      if (query.expressionMap.wheres.length > 0) {
        query = query.andWhere("payment.status = :status", { status });
      } else {
        query = query.where("payment.status = :status", { status });
      }
    }

    const payments = await query.getMany();

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Ошибка при получении платежей" },
      { status: 500 }
    );
  }
}

