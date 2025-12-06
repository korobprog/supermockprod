/**
 * Безопасный парсинг JSON из fetch ответа
 * Проверяет Content-Type перед парсингом, чтобы избежать ошибок при получении HTML
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`
    );
  }
  return response.json();
}

