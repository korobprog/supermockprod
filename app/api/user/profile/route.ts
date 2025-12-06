import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireAuthApi, isVirtualAdmin, VIRTUAL_ADMIN_ID } from "@/lib/auth-helpers";
import { userRepository } from "@/lib/db";
import { z } from "zod";

const updateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    telegram: z.string().max(100).optional().nullable(),
    discord: z.string().max(100).optional().nullable(),
    whatsapp: z.string().max(100).optional().nullable(),
});

export async function GET() {
    const authError = await requireAuthApi();
    if (authError) return authError;

    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.id) {
            return NextResponse.json(
                { error: "Пользователь не найден" },
                { status: 404 }
            );
        }

        // Если это виртуальный админ, возвращаем его данные без запроса к БД
        if (isVirtualAdmin(currentUser.id)) {
            return NextResponse.json({
                id: VIRTUAL_ADMIN_ID,
                email: currentUser.email,
                name: currentUser.name || 'Admin',
                telegram: null,
                discord: null,
                whatsapp: null,
                role: 'ADMIN',
                points: 0,
                createdAt: new Date().toISOString(),
            });
        }

        const userRepo = await userRepository();

        const user = await userRepo.findOne({
            where: { id: currentUser.id },
            select: ["id", "email", "name", "telegram", "discord", "whatsapp", "role", "points", "createdAt"],
        });

        if (!user) {
            return NextResponse.json(
                { error: "Пользователь не найден" },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { error: "Ошибка при получении профиля" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    const authError = await requireAuthApi();
    if (authError) return authError;

    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.id) {
            return NextResponse.json(
                { error: "Пользователь не найден" },
                { status: 404 }
            );
        }

        // Виртуальный админ не может обновлять профиль
        if (isVirtualAdmin(currentUser.id)) {
            return NextResponse.json(
                { error: "Виртуальный админ не может обновлять профиль" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const validatedData = updateProfileSchema.parse(body);

        const userRepo = await userRepository();

        const user = await userRepo.findOne({
            where: { id: currentUser.id },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Пользователь не найден" },
                { status: 404 }
            );
        }

        // Обновляем только переданные поля
        if (validatedData.name !== undefined) user.name = validatedData.name;
        if (validatedData.telegram !== undefined) user.telegram = validatedData.telegram;
        if (validatedData.discord !== undefined) user.discord = validatedData.discord;
        if (validatedData.whatsapp !== undefined) user.whatsapp = validatedData.whatsapp;

        await userRepo.save(user);

        return NextResponse.json({
            id: user.id,
            email: user.email,
            name: user.name,
            telegram: user.telegram,
            discord: user.discord,
            whatsapp: user.whatsapp,
            role: user.role,
            points: user.points,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Неверные данные", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { error: "Ошибка при обновлении профиля" },
            { status: 500 }
        );
    }
}
