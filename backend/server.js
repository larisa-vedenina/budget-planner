const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { Pool } = require("pg");
const twilio = require("twilio");

const DEFAULT_PORT = 8787;
const DEFAULT_PROVIDER = "deepseek";
const DEFAULT_MODEL = "deepseek-chat";
const DEFAULT_ALLOWED_ORIGIN = "http://localhost:3000";
const DEFAULT_AUTH_COOKIE_NAME = "budget_planner_session";
const DEFAULT_DATABASE_POOL_MAX = 5;
const DEFAULT_DATABASE_CONNECTION_TIMEOUT_MS = 10_000;
const DEFAULT_DATABASE_IDLE_TIMEOUT_MS = 30_000;
const DATABASE_SCHEMA_VERSION = "2026_05_07_001_budget_snapshot_storage";
const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_JSON_BODY_BYTES = 5 * 1024 * 1024;
const DEEPSEEK_CHAT_COMPLETIONS_URL = "https://api.deepseek.com/chat/completions";
const FRONTEND_BUILD_DIR = path.resolve(__dirname, "../frontend/build");

const BUDGET_PLAN_EXAMPLE = {
  summary: "Короткий общий вывод по бюджету пользователя.",
  totals: {
    incomeTotal: 120000,
    requiredTotal: 65000,
    desiredTotal: 18000,
    reserveAmount: 37000,
  },
  requiredItems: [
    {
      title: "Аренда",
      amount: 35000,
      priority: true,
    },
  ],
  desiredItems: [
    {
      title: "Кафе",
      amount: 5000,
      priority: false,
    },
  ],
  notes: [
    "Держите резерв на непредвиденные траты.",
    "Необязательные расходы лучше ограничить фиксированным лимитом.",
  ],
  warnings: [
    "Если доход задержится, часть необязательных трат придется сократить.",
  ],
};

const loadEnvFile = () => {
  const envPath = path.resolve(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const rawEnv = fs.readFileSync(envPath, "utf8");
  rawEnv.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

loadEnvFile();

const getIntegerEnv = (key, fallbackValue) => {
  const parsedValue = Number.parseInt(process.env[key] || "", 10);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallbackValue;
};

const parseDatabaseSsl = () => {
  const rawValue = String(process.env.DATABASE_SSL || "").trim().toLowerCase();

  if (["true", "require", "required"].includes(rawValue)) {
    return true;
  }

  if (["false", "disable", "disabled"].includes(rawValue)) {
    return false;
  }

  return Boolean(process.env.RENDER);
};

const getDatabaseUrlError = (databaseUrl) => {
  if (!databaseUrl) {
    return "";
  }

  try {
    const protocol = new URL(databaseUrl).protocol;

    if (!["postgres:", "postgresql:"].includes(protocol)) {
      return "DATABASE_URL должен быть PostgreSQL connection string: postgres:// или postgresql://.";
    }
  } catch (error) {
    return "DATABASE_URL некорректен. Проверьте строку подключения к PostgreSQL.";
  }

  return "";
};

const getDatabaseHost = (databaseUrl) => {
  if (!databaseUrl) {
    return "";
  }

  try {
    return new URL(databaseUrl).hostname.toLowerCase();
  } catch (error) {
    return "";
  }
};

const detectDatabaseProvider = (databaseUrl) => {
  const host = getDatabaseHost(databaseUrl);

  if (!host) {
    return "not_configured";
  }

  if (host === "localhost" || host === "127.0.0.1") {
    return "local-postgres";
  }

  if (host.includes("neon.tech")) {
    return "neon";
  }

  if (host.includes("supabase.co") || host.includes("pooler.supabase.com")) {
    return "supabase";
  }

  if (host.includes("render.com")) {
    return "render-postgres";
  }

  return "postgres";
};

const config = {
  provider: process.env.LLM_PROVIDER || DEFAULT_PROVIDER,
  host: process.env.HOST || (process.env.RENDER ? "0.0.0.0" : "127.0.0.1"),
  port: Number.parseInt(process.env.PORT || `${DEFAULT_PORT}`, 10) || DEFAULT_PORT,
  apiKey:
    process.env.DEEPSEEK_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "",
  model:
    process.env.DEEPSEEK_MODEL ||
    process.env.AI_MODEL ||
    process.env.OPENAI_MODEL ||
    DEFAULT_MODEL,
  allowedOrigin: process.env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN,
  databaseUrl: process.env.DATABASE_URL || "",
  databaseSsl: parseDatabaseSsl(),
  databasePoolMax: getIntegerEnv(
    "DATABASE_POOL_MAX",
    DEFAULT_DATABASE_POOL_MAX,
  ),
  databaseConnectionTimeoutMs: getIntegerEnv(
    "DATABASE_CONNECTION_TIMEOUT_MS",
    DEFAULT_DATABASE_CONNECTION_TIMEOUT_MS,
  ),
  databaseIdleTimeoutMs: getIntegerEnv(
    "DATABASE_IDLE_TIMEOUT_MS",
    DEFAULT_DATABASE_IDLE_TIMEOUT_MS,
  ),
  authCookieName: process.env.AUTH_COOKIE_NAME || DEFAULT_AUTH_COOKIE_NAME,
  cookieSecure:
    process.env.COOKIE_SECURE === "true" ||
    (process.env.COOKIE_SECURE !== "false" && Boolean(process.env.RENDER)),
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || "",
};

config.databaseUrlError = getDatabaseUrlError(config.databaseUrl);
config.databaseProvider = detectDatabaseProvider(config.databaseUrl);

const pool = config.databaseUrl && !config.databaseUrlError
  ? new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
      max: config.databasePoolMax,
      connectionTimeoutMillis: config.databaseConnectionTimeoutMs,
      idleTimeoutMillis: config.databaseIdleTimeoutMs,
    })
  : null;

if (pool) {
  pool.on("error", (error) => {
    console.error("[budget-planner-backend] Database pool error:", error.message);
  });
}

const twilioClient =
  config.twilioAccountSid &&
  config.twilioAuthToken &&
  config.twilioVerifyServiceSid
    ? twilio(config.twilioAccountSid, config.twilioAuthToken)
    : null;

const canServeFrontend = () =>
  fs.existsSync(path.join(FRONTEND_BUILD_DIR, "index.html"));

const getContentType = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".ico":
      return "image/x-icon";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
};

const sendFile = (response, filePath) => {
  response.writeHead(200, {
    "Content-Type": getContentType(filePath),
  });

  fs.createReadStream(filePath).pipe(response);
};

const getRequestPath = (request) =>
  decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);

const tryServeFrontend = (request, response) => {
  if (request.method !== "GET" || !canServeFrontend()) {
    return false;
  }

  const requestPath = getRequestPath(request);
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const assetPath = path.resolve(FRONTEND_BUILD_DIR, `.${safePath}`);

  if (
    assetPath.startsWith(FRONTEND_BUILD_DIR) &&
    fs.existsSync(assetPath) &&
    fs.statSync(assetPath).isFile()
  ) {
    sendFile(response, assetPath);
    return true;
  }

  sendFile(response, path.join(FRONTEND_BUILD_DIR, "index.html"));
  return true;
};

const createHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getCorsOrigin = (request) => {
  const requestOrigin = request.headers.origin;

  if (config.allowedOrigin === "*") {
    return requestOrigin || "*";
  }

  if (requestOrigin && requestOrigin === config.allowedOrigin) {
    return requestOrigin;
  }

  return config.allowedOrigin;
};

const sendJson = (request, response, statusCode, payload, extraHeaders = {}) => {
  const origin = getCorsOrigin(request);
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
    ...extraHeaders,
  };

  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(payload));
};

const sendNoContent = (request, response, extraHeaders = {}) => {
  const origin = getCorsOrigin(request);
  response.writeHead(204, {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
    ...extraHeaders,
  });
  response.end();
};

const handleCorsPreflight = (request, response) => {
  sendNoContent(request, response);
};

const readJsonBody = (request) =>
  new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > MAX_JSON_BODY_BYTES) {
        reject(createHttpError("Request body is too large.", 413));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(createHttpError("Invalid JSON body.", 400));
      }
    });

    request.on("error", reject);
  });

const parseCookies = (rawCookie = "") =>
  rawCookie
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((cookies, segment) => {
      const separatorIndex = segment.indexOf("=");
      if (separatorIndex === -1) {
        return cookies;
      }

      const key = segment.slice(0, separatorIndex).trim();
      const value = decodeURIComponent(segment.slice(separatorIndex + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});

const serializeCookie = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
};

const buildSessionCookie = (token) =>
  serializeCookie(config.authCookieName, token, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: config.cookieSecure,
    maxAge: SESSION_TTL_MS / 1000,
  });

const buildExpiredSessionCookie = () =>
  serializeCookie(config.authCookieName, "", {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: config.cookieSecure,
    maxAge: 0,
  });

const getDigits = (value) => String(value || "").replace(/\D/g, "");

const normalizePhone = (value) => {
  const digits = getDigits(value);

  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `7${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `7${digits}`;
  }

  return digits.slice(0, 11);
};

const formatPhoneDisplay = (value) => {
  const normalizedPhone = normalizePhone(value);

  if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith("7")) {
    return value;
  }

  const nationalDigits = normalizedPhone.slice(1);

  return `+7 (${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(
    3,
    6,
  )}-${nationalDigits.slice(6, 8)}-${nationalDigits.slice(8, 10)}`;
};

const toE164Phone = (value) => {
  const normalizedPhone = normalizePhone(value);
  return normalizedPhone ? `+${normalizedPhone}` : "";
};

const sanitizeName = (value) => String(value || "").trim();

const validateAuthPayload = (payload) => {
  const name = sanitizeName(payload?.name);
  const normalizedPhone = normalizePhone(payload?.phone);

  if (name.length < 2) {
    throw createHttpError("Укажите имя длиной не меньше 2 символов.", 400);
  }

  if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith("7")) {
    throw createHttpError("Введите номер телефона полностью.", 400);
  }

  return {
    name,
    normalizedPhone,
  };
};

const validateOtpCode = (value) => {
  const code = String(value || "").trim();

  if (!/^\d{6}$/.test(code)) {
    throw createHttpError("Введите 6-значный код.", 400);
  }

  return code;
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

const requireDatabase = () => {
  if (config.databaseUrlError) {
    throw createHttpError(config.databaseUrlError, 500);
  }

  if (!pool) {
    throw createHttpError("База данных не настроена. Добавьте DATABASE_URL.", 500);
  }
};

const requireTwilioVerify = () => {
  if (!twilioClient) {
    throw createHttpError(
      "Twilio Verify не настроен. Добавьте TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN и TWILIO_VERIFY_SERVICE_SID.",
      500,
    );
  }
};

const ensureDatabaseSchema = async () => {
  if (!pool) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    INSERT INTO schema_migrations (id)
    VALUES ('${DATABASE_SCHEMA_VERSION}')
    ON CONFLICT (id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      login TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
      ON auth_sessions (user_id);

    CREATE INDEX IF NOT EXISTS auth_sessions_token_hash_idx
      ON auth_sessions (token_hash);

    CREATE TABLE IF NOT EXISTS budget_snapshots (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      current_budget JSONB,
      budgets_history JSONB NOT NULL DEFAULT '[]'::jsonb,
      edit_mode BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS budget_snapshots_updated_at_idx
      ON budget_snapshots (updated_at DESC);
  `);
};

const deleteExpiredSessions = async () => {
  if (!pool) {
    return;
  }

  await pool.query(`
    DELETE FROM auth_sessions
    WHERE expires_at <= NOW()
  `);
};

const mapUserRecord = (row) => ({
  id: row.id,
  login: row.login,
  phone: formatPhoneDisplay(row.phone),
  email: row.email || undefined,
  avatarUrl: row.avatar_url || undefined,
  name: row.name,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  lastLogin:
    row.last_login instanceof Date
      ? row.last_login.toISOString()
      : row.last_login || undefined,
});

const findOrCreateUser = async ({ name, normalizedPhone }) => {
  requireDatabase();

  const existingUserResult = await pool.query(
    `
      SELECT *
      FROM users
      WHERE phone = $1
      LIMIT 1
    `,
    [normalizedPhone],
  );

  if (existingUserResult.rows[0]) {
    const updatedUserResult = await pool.query(
      `
        UPDATE users
        SET
          name = $2,
          login = $2,
          last_login = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [existingUserResult.rows[0].id, name],
    );

    return updatedUserResult.rows[0];
  }

  const newUserResult = await pool.query(
    `
      INSERT INTO users (id, name, login, phone, email, created_at, last_login)
      VALUES ($1, $2, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `,
    [
      `user_${crypto.randomUUID()}`,
      name,
      normalizedPhone,
      `${normalizedPhone}@budget.local`,
    ],
  );

  return newUserResult.rows[0];
};

const createSessionForUser = async (userId) => {
  requireDatabase();

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await pool.query(
    `
      INSERT INTO auth_sessions (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [`session_${crypto.randomUUID()}`, userId, tokenHash, expiresAt],
  );

  return {
    token,
    expiresAt,
  };
};

const getSessionToken = (request) => {
  const cookies = parseCookies(request.headers.cookie || "");
  return cookies[config.authCookieName] || "";
};

const resolveAuthenticatedUser = async (request) => {
  requireDatabase();

  const sessionToken = getSessionToken(request);
  if (!sessionToken) {
    return null;
  }

  const sessionResult = await pool.query(
    `
      SELECT
        s.id AS session_id,
        u.*
      FROM auth_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > NOW()
      LIMIT 1
    `,
    [hashToken(sessionToken)],
  );

  const row = sessionResult.rows[0];
  if (!row) {
    return null;
  }

  pool
    .query(
      `
        UPDATE auth_sessions
        SET last_used_at = NOW()
        WHERE id = $1
      `,
      [row.session_id],
    )
    .catch(() => undefined);

  return {
    userId: row.id,
    sessionId: row.session_id,
    user: mapUserRecord(row),
  };
};

const destroySession = async (request) => {
  if (!pool) {
    return;
  }

  const sessionToken = getSessionToken(request);
  if (!sessionToken) {
    return;
  }

  await pool.query(
    `
      DELETE FROM auth_sessions
      WHERE token_hash = $1
    `,
    [hashToken(sessionToken)],
  );
};

const normalizeBudgetSnapshot = (payload = {}) => ({
  currentBudget:
    payload.currentBudget && typeof payload.currentBudget === "object"
      ? payload.currentBudget
      : null,
  budgetsHistory: Array.isArray(payload.budgetsHistory)
    ? payload.budgetsHistory
    : [],
  editMode: Boolean(payload.editMode),
});

const loadBudgetSnapshotForUser = async (userId) => {
  requireDatabase();

  const snapshotResult = await pool.query(
    `
      SELECT current_budget, budgets_history, edit_mode
      FROM budget_snapshots
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  const row = snapshotResult.rows[0];
  if (!row) {
    return {
      currentBudget: null,
      budgetsHistory: [],
      editMode: false,
    };
  }

  return {
    currentBudget: row.current_budget || null,
    budgetsHistory: Array.isArray(row.budgets_history) ? row.budgets_history : [],
    editMode: Boolean(row.edit_mode),
  };
};

const saveBudgetSnapshotForUser = async (userId, snapshot) => {
  requireDatabase();

  const normalizedSnapshot = normalizeBudgetSnapshot(snapshot);

  await pool.query(
    `
      INSERT INTO budget_snapshots (
        user_id,
        current_budget,
        budgets_history,
        edit_mode,
        updated_at
      )
      VALUES ($1, $2::jsonb, $3::jsonb, $4, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        current_budget = EXCLUDED.current_budget,
        budgets_history = EXCLUDED.budgets_history,
        edit_mode = EXCLUDED.edit_mode,
        updated_at = NOW()
    `,
    [
      userId,
      normalizedSnapshot.currentBudget
        ? JSON.stringify(normalizedSnapshot.currentBudget)
        : null,
      JSON.stringify(normalizedSnapshot.budgetsHistory),
      normalizedSnapshot.editMode,
    ],
  );

  return normalizedSnapshot;
};

const sumAmounts = (items = []) =>
  items.reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);

const normalizeInputItem = (item = {}) => ({
  text: String(item.text || "").trim(),
  amount: Math.max(0, Math.round(Number(item.amount) || 0)),
  comment: String(item.comment || "").trim(),
});

const normalizePlanItem = (item = {}) => ({
  title: String(item.title || "").trim(),
  amount: Math.max(0, Math.round(Number(item.amount) || 0)),
  priority: Boolean(item.priority),
});

const normalizePlan = (plan = {}, requestPayload) => {
  const normalizedPlan = {
    summary: String(plan.summary || "").trim(),
    totals: {
      incomeTotal: Math.max(0, Math.round(Number(plan?.totals?.incomeTotal) || 0)),
      requiredTotal: Math.max(0, Math.round(Number(plan?.totals?.requiredTotal) || 0)),
      desiredTotal: Math.max(0, Math.round(Number(plan?.totals?.desiredTotal) || 0)),
      reserveAmount: Math.round(Number(plan?.totals?.reserveAmount) || 0),
    },
    requiredItems: Array.isArray(plan.requiredItems)
      ? plan.requiredItems.map(normalizePlanItem).filter((item) => item.title)
      : [],
    desiredItems: Array.isArray(plan.desiredItems)
      ? plan.desiredItems.map(normalizePlanItem).filter((item) => item.title)
      : [],
    notes: Array.isArray(plan.notes)
      ? plan.notes.map((note) => String(note || "").trim()).filter(Boolean)
      : [],
    warnings: Array.isArray(plan.warnings)
      ? plan.warnings.map((note) => String(note || "").trim()).filter(Boolean)
      : [],
  };

  if (!normalizedPlan.summary) {
    throw createHttpError("AI response does not contain a summary.", 502);
  }

  if (
    normalizedPlan.requiredItems.length === 0 &&
    normalizedPlan.desiredItems.length === 0
  ) {
    throw createHttpError("AI response does not contain budget items.", 502);
  }

  const incomeTotal = sumAmounts(requestPayload.sections.income);
  const requiredTotal = sumAmounts(normalizedPlan.requiredItems);
  const desiredTotal = sumAmounts(normalizedPlan.desiredItems);

  normalizedPlan.totals = {
    incomeTotal,
    requiredTotal,
    desiredTotal,
    reserveAmount: incomeTotal - requiredTotal - desiredTotal,
  };

  return normalizedPlan;
};

const buildNormalizedBudgetRequest = (payload = {}) => {
  const sections = payload.sections || {};

  return {
    period: {
      startDate: String(payload?.period?.startDate || ""),
      endDate: String(payload?.period?.endDate || ""),
    },
    aiComment: String(payload.aiComment || "").trim(),
    sections: {
      income: Array.isArray(sections.income)
        ? sections.income.map(normalizeInputItem)
        : [],
      required: Array.isArray(sections.required)
        ? sections.required.map(normalizeInputItem)
        : [],
      desired: Array.isArray(sections.desired)
        ? sections.desired.map(normalizeInputItem)
        : [],
      assets: Array.isArray(sections.assets)
        ? sections.assets.map(normalizeInputItem)
        : [],
      debts: Array.isArray(sections.debts)
        ? sections.debts.map(normalizeInputItem)
        : [],
      goals: Array.isArray(sections.goals)
        ? sections.goals.map(normalizeInputItem)
        : [],
    },
  };
};

const validateBudgetPlanRequest = (payload) => {
  if (!payload?.period?.startDate || !payload?.period?.endDate) {
    throw createHttpError("Budget period is required.", 400);
  }

  if (!Array.isArray(payload?.sections?.income) || payload.sections.income.length === 0) {
    throw createHttpError("At least one income item is required.", 400);
  }
};

const buildSystemPrompt = () => `
Ты финансовый AI-планировщик для русскоязычного приложения по ведению бюджета.

Твоя задача:
- на основе данных пользователя составить реалистичный и подробный план бюджета;
- распределить траты по двум категориям: обязательные и необязательные;
- уважать ограничение по доходу, если это возможно;
- если обязательные траты уже превышают доход, сохранить важные обязательные траты и явно предупредить о дефиците в warnings;
- использовать активы, долги, цели и свободный комментарий пользователя для приоритизации и рекомендаций;
- писать на русском языке;
- делать названия пунктов короткими и удобными для UI карточек;
- если в названии важно указать срок, добавляй его кратко в скобках;
- не выдумывать источники дохода, которых нет во входных данных;
- не добавлять комментариев вне JSON.

Правила качества плана:
- обязательные траты должны покрывать критически важные потребности;
- необязательные траты можно сокращать, объединять или откладывать ради баланса;
- если после обязательных трат остается запас, можно оставить часть в резерве и объяснить это в notes;
- notes должны быть практичными и конкретными, 3-6 пунктов;
- warnings заполняй только если есть риск, дефицит, спорное допущение или конфликт данных.
- ответ должен быть только одним валидным json-объектом без markdown и пояснений вне json.
`.trim();

const buildUserPrompt = (payload) => {
  const totals = {
    incomeTotal: sumAmounts(payload.sections.income),
    requiredInputTotal: sumAmounts(payload.sections.required),
    desiredInputTotal: sumAmounts(payload.sections.desired),
    assetsTotal: sumAmounts(payload.sections.assets),
    debtsTotal: sumAmounts(payload.sections.debts),
    goalsTotal: sumAmounts(payload.sections.goals),
  };

  return [
    "Составь план бюджета на основе этих данных пользователя.",
    "Верни только валидный json-объект.",
    "Используй строго эти ключи верхнего уровня: summary, totals, requiredItems, desiredItems, notes, warnings.",
    "Формат объекта-образца:",
    JSON.stringify(BUDGET_PLAN_EXAMPLE, null, 2),
    "",
    "Нормализованные данные пользователя:",
    JSON.stringify(
      {
        ...payload,
        totals,
      },
      null,
      2,
    ),
  ].join("\n");
};

const postJson = (url, payload, headers = {}) =>
  new Promise((resolve, reject) => {
    const targetUrl = new URL(url);
    const body = JSON.stringify(payload);

    const upstreamRequest = https.request(
      {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        port: targetUrl.port || 443,
        path: `${targetUrl.pathname}${targetUrl.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...headers,
        },
      },
      (upstreamResponse) => {
        let rawResponse = "";

        upstreamResponse.on("data", (chunk) => {
          rawResponse += chunk;
        });

        upstreamResponse.on("end", () => {
          let parsedResponse = {};

          try {
            parsedResponse = rawResponse ? JSON.parse(rawResponse) : {};
          } catch (error) {
            reject(createHttpError("AI provider returned invalid JSON.", 502));
            return;
          }

          if ((upstreamResponse.statusCode || 500) >= 400) {
            const upstreamError = createHttpError(
              parsedResponse?.error?.message || "AI provider request failed.",
              upstreamResponse.statusCode || 500,
            );
            reject(upstreamError);
            return;
          }

          resolve(parsedResponse);
        });
      },
    );

    upstreamRequest.on("error", reject);
    upstreamRequest.write(body);
    upstreamRequest.end();
  });

const extractChatCompletionText = (providerResponse) => {
  const firstChoice = Array.isArray(providerResponse?.choices)
    ? providerResponse.choices[0]
    : null;
  const content = firstChoice?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content;
  }

  throw createHttpError("AI response does not contain message content.", 502);
};

const generateBudgetPlan = async (payload) => {
  if (!config.apiKey) {
    throw createHttpError("AI API key is not configured.", 500);
  }

  const providerRequest = {
    model: config.model,
    temperature: 0.2,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(),
      },
      {
        role: "user",
        content: buildUserPrompt(payload),
      },
    ],
  };

  const providerResponse = await postJson(DEEPSEEK_CHAT_COMPLETIONS_URL, providerRequest, {
    Authorization: `Bearer ${config.apiKey}`,
  });

  const rawPlanText = extractChatCompletionText(providerResponse);
  return normalizePlan(JSON.parse(rawPlanText), payload);
};

const requestPhoneVerification = async (normalizedPhone) => {
  requireTwilioVerify();

  try {
    await twilioClient.verify.v2
      .services(config.twilioVerifyServiceSid)
      .verifications.create({
        to: toE164Phone(normalizedPhone),
        channel: "sms",
        locale: "ru",
      });
  } catch (error) {
    throw createHttpError(
      error?.message || "Не удалось отправить одноразовый код.",
      error?.status || 502,
    );
  }
};

const verifyPhoneCode = async (normalizedPhone, code) => {
  requireTwilioVerify();

  try {
    const result = await twilioClient.verify.v2
      .services(config.twilioVerifyServiceSid)
      .verificationChecks.create({
        to: toE164Phone(normalizedPhone),
        code,
      });

    if (result.status !== "approved") {
      throw createHttpError("Код не подошел. Попробуйте еще раз.", 400);
    }
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw createHttpError(
      error?.message || "Не удалось подтвердить одноразовый код.",
      error?.status || 502,
    );
  }
};

const handleHealthRequest = async (request, response) => {
  let databaseStatus = "not_configured";
  let databaseMessage;

  if (config.databaseUrlError) {
    databaseStatus = "error";
    databaseMessage = config.databaseUrlError;
  } else if (pool) {
    try {
      await pool.query("SELECT 1");
      databaseStatus = "ok";
    } catch (error) {
      databaseStatus = "error";
      databaseMessage = error.message;
    }
  }

  sendJson(request, response, 200, {
    success: true,
    data: {
      status: "ok",
      provider: config.provider,
      model: config.model,
      hasApiKey: Boolean(config.apiKey),
      databaseStatus,
      database: {
        status: databaseStatus,
        provider: config.databaseProvider,
        ssl: config.databaseSsl ? "enabled" : "disabled",
        poolMax: config.databasePoolMax,
        schemaVersion: DATABASE_SCHEMA_VERSION,
        message: databaseMessage,
      },
      authProvider: twilioClient ? "twilio-verify" : "not_configured",
    },
    timestamp: new Date().toISOString(),
  });
};

const handleAuthRequestCode = async (request, response) => {
  const requestBody = await readJsonBody(request);
  const { name, normalizedPhone } = validateAuthPayload(requestBody);

  await requestPhoneVerification(normalizedPhone);

  sendJson(request, response, 200, {
    success: true,
    data: {
      phone: formatPhoneDisplay(normalizedPhone),
      name,
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    },
    timestamp: new Date().toISOString(),
  });
};

const handleAuthVerifyCode = async (request, response) => {
  const requestBody = await readJsonBody(request);
  const { name, normalizedPhone } = validateAuthPayload(requestBody);
  const code = validateOtpCode(requestBody?.code);

  await verifyPhoneCode(normalizedPhone, code);

  const userRecord = await findOrCreateUser({
    name,
    normalizedPhone,
  });
  const session = await createSessionForUser(userRecord.id);

  sendJson(
    request,
    response,
    200,
    {
      success: true,
      data: {
        user: mapUserRecord(userRecord),
      },
      timestamp: new Date().toISOString(),
    },
    {
      "Set-Cookie": buildSessionCookie(session.token),
    },
  );
};

const handleAuthMe = async (request, response) => {
  const authenticatedUser = await resolveAuthenticatedUser(request);

  if (!authenticatedUser) {
    throw createHttpError("Сессия не найдена.", 401);
  }

  sendJson(request, response, 200, {
    success: true,
    data: {
      user: authenticatedUser.user,
    },
    timestamp: new Date().toISOString(),
  });
};

const handleAuthLogout = async (request, response) => {
  await destroySession(request);

  sendJson(
    request,
    response,
    200,
    {
      success: true,
      data: {
        loggedOut: true,
      },
      timestamp: new Date().toISOString(),
    },
    {
      "Set-Cookie": buildExpiredSessionCookie(),
    },
  );
};

const handleAvatarUpdate = async (request, response) => {
  const authenticatedUser = await resolveAuthenticatedUser(request);

  if (!authenticatedUser) {
    throw createHttpError("Сессия не найдена.", 401);
  }

  const requestBody = await readJsonBody(request);
  const avatarUrl = String(requestBody?.avatarUrl || "").trim();

  if (avatarUrl.length > 1_500_000) {
    throw createHttpError("Файл аватара получился слишком большим.", 413);
  }

  const updateResult = await pool.query(
    `
      UPDATE users
      SET avatar_url = $2
      WHERE id = $1
      RETURNING *
    `,
    [authenticatedUser.userId, avatarUrl || null],
  );

  sendJson(request, response, 200, {
    success: true,
    data: {
      user: mapUserRecord(updateResult.rows[0]),
    },
    timestamp: new Date().toISOString(),
  });
};

const handleLoadBudgetSnapshot = async (request, response) => {
  const authenticatedUser = await resolveAuthenticatedUser(request);

  if (!authenticatedUser) {
    throw createHttpError("Сессия не найдена.", 401);
  }

  const snapshot = await loadBudgetSnapshotForUser(authenticatedUser.userId);

  sendJson(request, response, 200, {
    success: true,
    data: snapshot,
    timestamp: new Date().toISOString(),
  });
};

const handleSaveBudgetSnapshot = async (request, response) => {
  const authenticatedUser = await resolveAuthenticatedUser(request);

  if (!authenticatedUser) {
    throw createHttpError("Сессия не найдена.", 401);
  }

  const requestBody = await readJsonBody(request);
  const savedSnapshot = await saveBudgetSnapshotForUser(
    authenticatedUser.userId,
    requestBody,
  );

  sendJson(request, response, 200, {
    success: true,
    data: savedSnapshot,
    timestamp: new Date().toISOString(),
  });
};

const handleGenerateBudgetPlan = async (request, response) => {
  const requestBody = await readJsonBody(request);
  const normalizedPayload = buildNormalizedBudgetRequest(requestBody);
  validateBudgetPlanRequest(normalizedPayload);

  const plan = await generateBudgetPlan(normalizedPayload);

  sendJson(request, response, 200, {
    success: true,
    data: plan,
    timestamp: new Date().toISOString(),
  });
};

const handleApiRequest = async (request, response) => {
  const requestPath = getRequestPath(request);

  if (request.method === "GET" && requestPath === "/health") {
    await handleHealthRequest(request, response);
    return true;
  }

  if (request.method === "POST" && requestPath === "/api/auth/request-code") {
    await handleAuthRequestCode(request, response);
    return true;
  }

  if (request.method === "POST" && requestPath === "/api/auth/verify-code") {
    await handleAuthVerifyCode(request, response);
    return true;
  }

  if (request.method === "GET" && requestPath === "/api/auth/me") {
    await handleAuthMe(request, response);
    return true;
  }

  if (request.method === "POST" && requestPath === "/api/auth/logout") {
    await handleAuthLogout(request, response);
    return true;
  }

  if (request.method === "PATCH" && requestPath === "/api/auth/avatar") {
    await handleAvatarUpdate(request, response);
    return true;
  }

  if (request.method === "GET" && requestPath === "/api/budget-snapshot") {
    await handleLoadBudgetSnapshot(request, response);
    return true;
  }

  if (request.method === "PUT" && requestPath === "/api/budget-snapshot") {
    await handleSaveBudgetSnapshot(request, response);
    return true;
  }

  if (request.method === "POST" && requestPath === "/api/ai/budget-plan") {
    await handleGenerateBudgetPlan(request, response);
    return true;
  }

  return false;
};

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      handleCorsPreflight(request, response);
      return;
    }

    const handled = await handleApiRequest(request, response);
    if (handled) {
      return;
    }

    if (request.method === "GET" && !getRequestPath(request).startsWith("/api/")) {
      if (tryServeFrontend(request, response)) {
        return;
      }
    }

    sendJson(request, response, 404, {
      success: false,
      message: "Route not found.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    console.error("[budget-planner-backend] Request failed:", {
      path: request.url,
      method: request.method,
      message: error.message,
      statusCode,
    });

    sendJson(request, response, statusCode, {
      success: false,
      message: error.message || "Internal server error.",
      timestamp: new Date().toISOString(),
    });
  }
});

const initializeDatabaseSchema = async () => {
  if (!pool) {
    return;
  }

  try {
    await ensureDatabaseSchema();
    await deleteExpiredSessions();
    console.log("[budget-planner-backend] Database schema is ready.");
  } catch (error) {
    console.error(
      "[budget-planner-backend] Database initialization failed during startup. The app will stay online, but auth and remote budget sync will be unavailable until the database becomes reachable.",
      error,
    );
  }
};

const startServer = async () => {
  server.listen(config.port, config.host, () => {
    console.log(
      `[budget-planner-backend] listening on http://${config.host}:${config.port} using ${config.provider}/${config.model}`,
    );

    if (!config.apiKey) {
      console.warn(
        "[budget-planner-backend] AI API key is missing. AI generation will fail until you add it to backend/.env.",
      );
    }

    if (!pool) {
      if (config.databaseUrlError) {
        console.warn(
          `[budget-planner-backend] ${config.databaseUrlError} Real user accounts and remote budget sync will be unavailable.`,
        );
      } else {
        console.warn(
          "[budget-planner-backend] DATABASE_URL is missing. Real user accounts and remote budget sync will be unavailable.",
        );
      }
    }

    if (!twilioClient) {
      console.warn(
        "[budget-planner-backend] Twilio Verify is not configured. SMS verification will be unavailable.",
      );
    }

    void initializeDatabaseSchema();
  });
};

startServer().catch((error) => {
  console.error("[budget-planner-backend] Failed to start server:", error);
  process.exit(1);
});
