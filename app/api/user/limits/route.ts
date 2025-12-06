import { NextResponse } from "next/server";
import { requireAuthApi, getCurrentUser } from "@/lib/auth-helpers";
import { checkInterviewLimit } from "@/lib/points";

export async function GET() {
  try {
    const authError = await requireAuthApi();
    if (authError) {
      return authError;
    }
    const user = await getCurrentUser();
    const limitInfo = await checkInterviewLimit((user as any).id);
    return NextResponse.json(limitInfo);
  } catch (error) {
    console.error("Error fetching limits:", error);
    return NextResponse.json(
      { error: "Ошибка при получении лимитов" },
      { status: 500 }
    );
  }
}

