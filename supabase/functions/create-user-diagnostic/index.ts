import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function serializeError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return {
      name: null,
      message: typeof error === "string" ? error : null,
      status: null,
      code: null,
      raw: error,
      asString: String(error),
    };
  }

  const record = error as Record<string, unknown>;
  const ownProperties: Record<string, unknown> = {};

  for (const key of Object.getOwnPropertyNames(error)) {
    ownProperties[key] = record[key];
  }

  return {
    name: typeof record.name === "string" ? record.name : null,
    message: typeof record.message === "string" ? record.message : null,
    status:
      typeof record.status === "number" || typeof record.status === "string" ? record.status : null,
    code: typeof record.code === "string" ? record.code : null,
    raw: record,
    ownProperties,
    stringified: JSON.stringify(record),
    asString: String(error),
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        {
          success: false,
          environment: {
            SUPABASE_URL_loaded: Boolean(supabaseUrl),
            SUPABASE_SERVICE_ROLE_KEY_loaded: Boolean(serviceRoleKey),
          },
          error: {
            message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
          },
        },
        500,
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "");
    const email = `diagnostic-${timestamp}@example.com`;

    const result = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "TemporaryPassword123!",
      email_confirm: true,
    });

    return jsonResponse({
      success: !result.error,
      environment: {
        SUPABASE_URL_loaded: true,
        SUPABASE_SERVICE_ROLE_KEY_loaded: true,
      },
      request: {
        email,
        passwordLength: "TemporaryPassword123!".length,
        email_confirm: true,
      },
      result,
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        thrown: serializeError(error),
      },
      500,
    );
  }
});
