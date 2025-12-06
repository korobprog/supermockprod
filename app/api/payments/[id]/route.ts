import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-helpers";
import { paymentRepository, userRepository, PaymentStatus } from "@/lib/db";
import { z } from "zod";

const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  adminNote: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdminApi();
    if (authError) {
      return authError;
    }
    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePaymentSchema.parse(body);
    const paymentRepo = await paymentRepository();
    const payment = await paymentRepo.findOne({
      where: { id },
      relations: ["user"],
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Платеж не найден" },
        { status: 404 }
      );
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return NextResponse.json(
        { error: "Платеж уже обработан" },
        { status: 400 }
      );
    }

    payment.status = validatedData.status as PaymentStatus;

    if (validatedData.adminNote) {
      payment.adminNote = validatedData.adminNote;
    }

    // Если платеж одобрен, зачисляем баллы пользователю
    if (validatedData.status === PaymentStatus.APPROVED) {
      const userRepo = await userRepository();
      const user = await userRepo.findOne({ where: { id: payment.userId } });
      if (user) {
        user.points += payment.amount;
        await userRepo.save(user);
      }
    }

    await paymentRepo.save(payment);
    const updatedPayment = await paymentRepo.findOne({
      where: { id },
      relations: ["user"],
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные данные", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении платежа" },
      { status: 500 }
    );
  }
}

