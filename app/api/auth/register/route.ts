import { NextResponse } from "next/server";
import { initDB, userRepository } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomUUID } from "crypto";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  await initDB();
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const repo = await userRepository();
    const existingUser = await repo.findOne({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = repo.create({
      id: randomUUID(),
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
    });

    await repo.save(user);

    return NextResponse.json(
      { message: "Пользователь успешно зарегистрирован", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные данные" },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Ошибка при регистрации" },
      { status: 500 }
    );
  }
}
