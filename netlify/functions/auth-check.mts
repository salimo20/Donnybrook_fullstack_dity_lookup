Try AI directly in your favorite apps … Use Gemini to generate drafts and refine content, plus get Gemini Pro with access to Google's next-gen AI for €21.99 €5.49 for 3 months (personalized price)
1
100%
import type { Context, Config } from "@netlify/functions";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  const ok = !!expected && body.password === expected;

  return new Response(JSON.stringify({ ok }), {
    status: ok ? 200 : 401,
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/auth-check",
};
