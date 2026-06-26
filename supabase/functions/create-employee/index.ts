import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

type AccessLevel = "manager" | "employee";
type JobRole =
  | "Production Head"
  | "Senior Graphic Designer"
  | "Graphic Designer"
  | "Video Producer"
  | "Content Writer";

type RoleMetadata = {
  accessLevel: AccessLevel;
  department: "Production" | "Design" | "Content";
};

type RawCreateEmployeePayload = {
  full_name?: unknown;
  email?: unknown;
  password?: unknown;
  job_role?: unknown;
};

type CreateEmployeePayload = {
  fullName: string;
  email: string;
  password: string;
  jobRole: JobRole;
  metadata: RoleMetadata;
};

type AppErrorCode =
  | "method_not_allowed"
  | "server_misconfigured"
  | "missing_bearer_token"
  | "unauthorized_caller"
  | "forbidden"
  | "invalid_json"
  | "validation_failed"
  | "invalid_job_role"
  | "duplicate_email"
  | "weak_password"
  | "auth_user_create_failed"
  | "profile_update_failed"
  | "legacy_users_insert_failed"
  | "unexpected_error";

type AppError = {
  code: AppErrorCode;
  message: string;
  status: number;
  cause?: unknown;
  details?: unknown;
};

type CreatedEmployee = {
  userId: string;
  email: string;
  role: AccessLevel;
  job_role: JobRole;
};

const JOB_ROLE_METADATA: Record<JobRole, RoleMetadata> = {
  "Production Head": { accessLevel: "manager", department: "Production" },
  "Senior Graphic Designer": { accessLevel: "manager", department: "Design" },
  "Graphic Designer": { accessLevel: "employee", department: "Design" },
  "Video Producer": { accessLevel: "employee", department: "Production" },
  "Content Writer": { accessLevel: "employee", department: "Content" },
};

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

type SupabaseClients = {
  admin: SupabaseClient;
  authVerifier: SupabaseClient;
};

function appError(
  code: AppErrorCode,
  message: string,
  status = 400,
  cause?: unknown,
  details?: unknown,
): AppError {
  return { code, message, status, cause, details };
}

function errorResponse(error: AppError) {
  logFailure(error.code, error.message, error.cause, error.details);
  return jsonResponse(
    { error: { code: error.code, message: error.message, details: error.details } },
    error.status,
  );
}

function logFailure(code: string, message: string, cause?: unknown, details?: unknown) {
  console.error(`[create-employee] ${code}: ${message}`, {
    cause,
    details,
  });
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function serviceRoleKeyDetails(key: string) {
  const jwtPayload = parseJwtPayload(key);

  return {
    jwtRole: typeof jwtPayload?.role === "string" ? jwtPayload.role : null,
    keyKind: key.startsWith("sb_secret_")
      ? "secret"
      : key.startsWith("sb_publishable_")
        ? "publishable"
        : jwtPayload
          ? "jwt"
          : "unknown",
  };
}

function assertServiceRoleKey(key: string) {
  const details = serviceRoleKeyDetails(key);

  if (details.keyKind === "publishable" || details.jwtRole === "anon") {
    throw appError(
      "server_misconfigured",
      "SUPABASE_SERVICE_ROLE_KEY is not a service role key.",
      500,
      "The configured key cannot call Supabase Auth Admin APIs.",
      details,
    );
  }
}

function createSupabaseClients(): SupabaseClients {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  console.info("[create-employee] environment check", {
    "SUPABASE_URL loaded": Boolean(supabaseUrl),
    "SUPABASE_SERVICE_ROLE_KEY loaded": Boolean(serviceRoleKey),
  });

  if (!supabaseUrl || !serviceRoleKey) {
    throw appError(
      "server_misconfigured",
      "Employee creation is not configured.",
      500,
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  assertServiceRoleKey(serviceRoleKey);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    },
  });

  const authVerifier = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.info("[create-employee] Supabase clients initialized.", {
    serviceRoleKeyType: serviceRoleKeyDetails(serviceRoleKey),
  });

  return { admin, authVerifier };
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    throw appError(
      "missing_bearer_token",
      "Missing bearer token. Sign in as an admin before inviting employees.",
      401,
    );
  }

  return token;
}

function requireString(value: unknown, field: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw appError("validation_failed", `${field} is required.`, 400);
  return text;
}

function normalizeEmail(value: unknown) {
  const email = requireString(value, "Email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw appError("validation_failed", "Enter a valid email address.", 400);
  }
  return email;
}

function roleMetadata(value: unknown): { jobRole: JobRole; metadata: RoleMetadata } {
  const jobRole = requireString(value, "Job role");

  if (!Object.prototype.hasOwnProperty.call(JOB_ROLE_METADATA, jobRole)) {
    throw appError("invalid_job_role", "Select a valid job role.", 400, { jobRole });
  }

  return {
    jobRole: jobRole as JobRole,
    metadata: JOB_ROLE_METADATA[jobRole as JobRole],
  };
}

async function parsePayload(request: Request): Promise<CreateEmployeePayload> {
  let raw: RawCreateEmployeePayload;

  try {
    raw = await request.json();
  } catch (cause) {
    throw appError("invalid_json", "Invite request must be valid JSON.", 400, cause);
  }

  const { jobRole, metadata } = roleMetadata(raw.job_role);

  return {
    fullName: requireString(raw.full_name, "Full name"),
    email: normalizeEmail(raw.email),
    password: requireString(raw.password, "Password"),
    jobRole,
    metadata,
  };
}

async function requireAdminCaller(clients: SupabaseClients, request: Request) {
  const token = bearerToken(request);
  const { data: caller, error: callerError } = await clients.authVerifier.auth.getUser(token);

  if (callerError || !caller.user) {
    throw appError(
      "unauthorized_caller",
      "Your session could not be verified.",
      401,
      callerError,
      serializeError(callerError),
    );
  }

  const { data: profile, error: profileError } = await clients.admin
    .from("profiles")
    .select("role")
    .eq("id", caller.user.id)
    .maybeSingle();

  if (profileError) {
    throw appError(
      "unauthorized_caller",
      "Unable to verify admin access.",
      500,
      profileError,
      serializeError(profileError),
    );
  }

  if (profile?.role?.trim().toLowerCase() !== "admin") {
    throw appError("forbidden", "Only admins can invite employees.", 403, {
      callerId: caller.user.id,
      role: profile?.role ?? null,
    });
  }
}

function serializeError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return {
      name: null,
      message: typeof error === "string" ? error : null,
      status: null,
      code: null,
      raw: error,
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

function authCreateError(error: unknown): AppError {
  const details = serializeError(error);
  const rawMessage = typeof details.message === "string" ? details.message : "";
  const message =
    rawMessage && rawMessage !== "{}" ? rawMessage : "Supabase Auth Admin createUser failed.";
  const normalized = message.toLowerCase();
  const status = typeof details.status === "number" ? details.status : 500;

  console.error("[create-employee] auth.admin.createUser failed.", details);

  if (
    normalized.includes("already") ||
    normalized.includes("duplicate") ||
    normalized.includes("registered")
  ) {
    return appError(
      "duplicate_email",
      "A user with this email already exists.",
      409,
      error,
      details,
    );
  }

  if (normalized.includes("password") || normalized.includes("weak")) {
    return appError("weak_password", message, status === 500 ? 422 : status, error, details);
  }

  return appError("auth_user_create_failed", message, status, error, details);
}

async function createAuthUser(
  supabaseAdmin: SupabaseClient,
  payload: CreateEmployeePayload,
): Promise<string> {
  console.info("[create-employee] Calling auth.admin.createUser.", {
    email: payload.email,
    job_role: payload.jobRole,
    passwordLength: payload.password.length,
  });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      full_name: payload.fullName,
      job_role: payload.jobRole,
    },
  });

  if (error || !data.user) throw authCreateError(error ?? { message: "No user returned." });
  return data.user.id;
}

async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  payload: CreateEmployeePayload,
) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: payload.fullName,
      email: payload.email,
      role: payload.metadata.accessLevel,
      job_role: payload.jobRole,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw appError("profile_update_failed", "Unable to update employee profile.", 500, error);
  }
}

async function insertLegacyUser(
  supabase: SupabaseClient,
  userId: string,
  payload: CreateEmployeePayload,
) {
  const { error } = await supabase.from("users").insert({
    id: userId,
    name: payload.fullName,
    email: payload.email,
    department: payload.metadata.department,
    position: payload.jobRole,
    avatar_url: null,
    status: "active",
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw appError("legacy_users_insert_failed", "Unable to create legacy user row.", 500, error);
  }
}

async function rollbackCreatedUser(supabase: SupabaseClient, userId: string, reason: AppError) {
  console.error(`[create-employee] Rolling back auth user ${userId} after ${reason.code}.`);

  const { error: profileDeleteError } = await supabase.from("profiles").delete().eq("id", userId);
  if (profileDeleteError) {
    logFailure(
      "profile_rollback_failed",
      "Unable to delete profile during rollback.",
      profileDeleteError,
    );
  }

  const { error: legacyDeleteError } = await supabase.from("users").delete().eq("id", userId);
  if (legacyDeleteError) {
    logFailure(
      "legacy_user_rollback_failed",
      "Unable to delete legacy user during rollback.",
      legacyDeleteError,
    );
  }

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    logFailure(
      "auth_rollback_failed",
      "Unable to delete auth user during rollback.",
      authDeleteError,
    );
  }
}

async function createEmployee(
  supabase: SupabaseClient,
  payload: CreateEmployeePayload,
): Promise<CreatedEmployee> {
  const userId = await createAuthUser(supabase, payload);

  try {
    await updateProfile(supabase, userId, payload);
    await insertLegacyUser(supabase, userId, payload);
  } catch (error) {
    const failure =
      typeof error === "object" && error !== null && "code" in error
        ? (error as AppError)
        : appError("unexpected_error", "Unable to finish employee creation.", 500, error);

    await rollbackCreatedUser(supabase, userId, failure);
    throw failure;
  }

  return {
    userId,
    email: payload.email,
    role: payload.metadata.accessLevel,
    job_role: payload.jobRole,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (request.method !== "POST") {
      throw appError("method_not_allowed", "Use POST to create an employee.", 405);
    }

    const clients = createSupabaseClients();
    await requireAdminCaller(clients, request);

    const payload = await parsePayload(request);
    const employee = await createEmployee(clients.admin, payload);

    return jsonResponse({
      success: true,
      userId: employee.userId,
      email: employee.email,
      role: employee.role,
      job_role: employee.job_role,
    });
  } catch (error) {
    const failure =
      typeof error === "object" && error !== null && "code" in error
        ? (error as AppError)
        : appError("unexpected_error", "Unexpected employee creation failure.", 500, error);

    return errorResponse(failure);
  }
});
