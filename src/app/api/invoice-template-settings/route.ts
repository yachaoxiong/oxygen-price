import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type TemplateRow = {
  id: string;
  user_id: string;
  name: string;
  settings_json: Record<string, unknown>;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

function getSupabaseFromRequest(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 未配置");
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return { supabase: null, token: null };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  return { supabase, token };
}

async function getAuthedContext(request: Request) {
  const { supabase, token } = getSupabaseFromRequest(request);

  if (!supabase || !token) {
    return { errorResponse: NextResponse.json({ ok: false, message: "请先登录后再操作模板设置" }, { status: 401 }) };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError) {
    return { errorResponse: NextResponse.json({ ok: false, message: userError.message }, { status: 401 }) };
  }

  if (!user) {
    return { errorResponse: NextResponse.json({ ok: false, message: "请先登录后再操作模板设置" }, { status: 401 }) };
  }

  return { supabase, user };
}

export async function GET(request: Request) {
  try {
    const context = await getAuthedContext(request);
    if ("errorResponse" in context) {
      return context.errorResponse;
    }

    const { supabase, user } = context;

    const { data, error } = await supabase
      .from("invoice_template_settings")
      .select("id, user_id, name, settings_json, is_default, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as TemplateRow[];
    const defaultRow = rows.find((row) => row.is_default) ?? null;

    return NextResponse.json({
      ok: true,
      data: {
        rows,
        default: defaultRow,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to load invoice template settings.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  let payload: { settings?: Record<string, unknown> };

  try {
    payload = (await request.json()) as { settings?: Record<string, unknown> };
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request payload." }, { status: 400 });
  }

  if (!payload?.settings || typeof payload.settings !== "object") {
    return NextResponse.json({ ok: false, message: "Template settings are required." }, { status: 400 });
  }

  try {
    const context = await getAuthedContext(request);
    if ("errorResponse" in context) {
      return context.errorResponse;
    }

    const { supabase, user } = context;

    const { data: existing, error: findError } = await supabase
      .from("invoice_template_settings")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ ok: false, message: findError.message }, { status: 500 });
    }

    if (existing?.id) {
      const { data, error } = await supabase
        .from("invoice_template_settings")
        .update({
          settings_json: payload.settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id, user_id, name, settings_json, is_default, created_at, updated_at")
        .single();

      if (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data });
    }

    const { data, error } = await supabase
      .from("invoice_template_settings")
      .insert({
        user_id: user.id,
        name: "默认模板",
        settings_json: payload.settings,
        is_default: true,
      })
      .select("id, user_id, name, settings_json, is_default, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to save invoice template settings.",
      },
      { status: 500 },
    );
  }
}
