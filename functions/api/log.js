// 찌라시 사용 기록 API - POST /api/log
// 사용자 이메일은 브라우저가 보낸 값이 아니라, Cloudflare Access가 붙여주는 헤더에서만 읽는다(위조 방지).
const ALLOWED_ACTIONS = new Set([
  "open",       // 찌라시 첫 화면 열기
  "view_card",  // 상품을 골라 카드로 담기
  "search",     // 검색
  "filter",     // 분류/필터 선택
  "share",      // 카드 복사 / 메일 준비
  "download",   // 이미지/PDF 저장 (현재 화면에 해당 기능 없음 - 예비)
  "print",      // 인쇄 (현재 화면에 해당 기능 없음 - 예비)
  "tab",        // 탭(메뉴) 이동 - 2026-11-12 추가
]);

export async function onRequestPost({ request, env }) {
  const email = (request.headers.get("Cf-Access-Authenticated-User-Email") || "").trim().toLowerCase();
  if (!email) return new Response("no identity", { status: 401 });
  if (!env.DB) return new Response("db not bound", { status: 500 });

  let body = {};
  try { body = await request.json(); } catch (e) { /* 빈 본문 허용 안 함 */ }

  const action = String(body.action || "").slice(0, 40);
  if (!ALLOWED_ACTIONS.has(action)) return new Response("bad action", { status: 400 });
  const page = String(body.page || "").slice(0, 200);
  const detail = String(body.detail || "").slice(0, 300);

  await env.DB.prepare(
    "INSERT INTO usage_events (user_email, action, page, detail) VALUES (?1, ?2, ?3, ?4)"
  ).bind(email, action, page, detail).run();

  return new Response(null, { status: 204 });
}
