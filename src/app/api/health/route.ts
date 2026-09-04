/**
 * Технический эндпоинт для проверки живости серверной сборки (песочница).
 * При статическом экспорте (GitHub Pages) превращается в статический файл —
 * приложение его не вызывает, интерфейсу сервер не нужен.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json({ ok: true, app: "klasskassa" });
}
