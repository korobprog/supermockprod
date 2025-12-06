import { auth } from "./auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function getCurrentUser() {
  try {
    const session = await auth();
    return session?.user || null;
  } catch (error: any) {
    // Игнорируем ошибки расшифровки JWT (когда пользователь не авторизован или токен невалиден)
    // Это нормальная ситуация для неавторизованных пользователей
    // Подавляем логирование ошибок для JWTSessionError, так как это ожидаемое поведение
    if (error?.name === "JWTSessionError" || error?.message?.includes("decryption secret")) {
      return null;
    }
    // Для других ошибок также возвращаем null, но можно было бы их логировать
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if ((user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

// Функции для API routes - возвращают JSON вместо redirect
export async function requireAuthApi(): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Необходима авторизация" },
      { status: 401 }
    );
  }
  return null; // null означает успех
}

export async function requireAdminApi(): Promise<NextResponse | null> {
  const authError = await requireAuthApi();
  if (authError) {
    return authError;
  }
  const user = await getCurrentUser();
  if ((user as any).role !== "ADMIN") {
    return NextResponse.json(
      { error: "Требуются права администратора" },
      { status: 403 }
    );
  }
  return null; // null означает успех
}

