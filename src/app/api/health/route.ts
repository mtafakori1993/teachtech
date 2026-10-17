export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ ok: true, app: "teachtech" }, { headers: { "Cache-Control": "no-store" } });
}
