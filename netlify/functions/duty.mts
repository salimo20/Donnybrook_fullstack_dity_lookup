import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function norm(s: string): string {
  const part = s.includes("/") ? s.split("/").pop()! : s;
  return part.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^0+/, "");
}

const ALLOWED_FIELDS = new Set([
  "report", "depart", "start_loc",
  "break_start", "break_loc", "period2_report", "period2_start", "period2_loc",
  "finish", "finish_loc", "sign_off",
  "spread", "work", "relief", "b_rota", "route_no",
  "stops", "handovers",
]);

export default async (req: Request, _context: Context) => {
  const supabase = getClient();
  if (!supabase) {
    return json({ error: "server_not_configured", message: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set." }, 500);
  }

  const url = new URL(req.url);

  if (req.method === "GET") {
    const roster = url.searchParams.get("roster");
    const q = url.searchParams.get("q");
    const day = url.searchParams.get("day");

    if (!day) return json({ error: "day is required" }, 400);

    if (roster) {
      const { data, error } = await supabase
        .from("duties")
        .select("*")
        .eq("day_type", day)
        .ilike("roster", roster)
        .maybeSingle();
      if (error) return json({ error: "db_error", message: error.message }, 500);
      if (!data) return json({ error: "not_found" }, 404);
      return json(data);
    }

    if (q) {
      const wanted = norm(q);
      const { data, error } = await supabase
        .from("duties")
        .select("roster, zone, duty_no, report, depart, sign_off, route_no")
        .eq("day_type", day);
      if (error) return json({ error: "db_error", message: error.message }, 500);
      const matches = (data || [])
        .filter((r) => norm(r.roster).startsWith(wanted))
        .sort((a, b) => a.roster.localeCompare(b.roster))
        .slice(0, 30);
      return json(matches);
    }

    return json({ error: "roster or q is required" }, 400);
  }

  if (req.method === "PUT") {
    const expected = process.env.ADMIN_PASSWORD;
    const supplied = req.headers.get("x-admin-password");
    if (!expected) {
      return json({ error: "server_not_configured", message: "ADMIN_PASSWORD not set." }, 500);
    }
    if (!supplied || supplied !== expected) {
      return json({ error: "unauthorized" }, 401);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    const { id, ...fields } = body;
    if (!id) return json({ error: "id is required" }, 400);

    const updateObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (!ALLOWED_FIELDS.has(key)) continue;
      updateObj[key] = value === "" ? null : value;
    }
    if (Object.keys(updateObj).length === 0) return json({ error: "no_valid_fields" }, 400);
    updateObj.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("duties")
      .update(updateObj)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return json({ error: "db_error", message: error.message }, 500);
    if (!data) return json({ error: "not_found" }, 404);
    return json(data);
  }

  return json({ error: "method_not_allowed" }, 405);
};

export const config: Config = {
  path: "/api/duty",
};
