const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { Pool } = require("pg");

const DEFAULT_PORT = 8787;
const DEFAULT_PROVIDER = "gemini";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
const DEFAULT_EMAIL_PROVIDER = "resend";
const DEFAULT_ALLOWED_ORIGIN = "http://localhost:3000";
const DEFAULT_AUTH_COOKIE_NAME = "budget_planner_session";
const DEFAULT_DATABASE_POOL_MAX = 5;
const DEFAULT_DATABASE_CONNECTION_TIMEOUT_MS = 10_000;
const DEFAULT_DATABASE_IDLE_TIMEOUT_MS = 30_000;
const DATABASE_SCHEMA_VERSION = "2026_05_08_001_email_auth_resend";
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_JSON_BODY_BYTES = 5 * 1024 * 1024;
const SIMPLE_AI_NOTES_LIMIT = 2;
const DEFAULT_AI_NOTES_LIMIT = 4;
const RICH_AI_NOTES_LIMIT = 5;
const MAX_AI_WARNINGS = 2;
const DEEPSEEK_CHAT_COMPLETIONS_URL = "https://api.deepseek.com/chat/completions";
const GEMINI_GENERATE_CONTENT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";
const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const FRONTEND_BUILD_DIR = path.resolve(__dirname, "../frontend/build");

const BUDGET_PLAN_EXAMPLE = {
  summary: "План покрывает обязательные платежи и оставляет посильный взнос на цель.",
  totals: {
    incomeTotal: 120000,
    requiredTotal: 43000,
    desiredTotal: 12000,
    reserveAmount: 65000,
  },
  requiredItems: [
    {
      title: "Аренда",
      amount: 35000,
      priority: true,
      date: "1 июня",
    },
    {
      title: "Платеж по долгу",
      amount: 8000,
      priority: true,
      badge: "debt",
      date: "20 июня",
    },
  ],
  desiredItems: [
    {
      title: "Париж",
      amount: 12000,
      priority: false,
      badge: "goal",
      date: "конец августа",
    },
  ],
  notes: [
    "На Париж можно выделить 12 000 ₽ в этом периоде. Остальную сумму лучше планировать в следующих бюджетах.",
  ],
  warnings: [],
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

const normalizeProvider = (provider) => {
  const normalizedProvider = String(provider || DEFAULT_PROVIDER)
    .trim()
    .toLowerCase();

  if (["gemini", "google", "google-gemini"].includes(normalizedProvider)) {
    return "gemini";
  }

  if (normalizedProvider === "deepseek") {
    return "deepseek";
  }

  return normalizedProvider;
};

const getProviderApiKey = (provider) => {
  if (provider === "gemini") {
    return (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.AI_API_KEY ||
      ""
    );
  }

  if (provider === "deepseek") {
    return (
      process.env.DEEPSEEK_API_KEY ||
      process.env.AI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ""
    );
  }

  return process.env.AI_API_KEY || "";
};

const getProviderModel = (provider) => {
  if (provider === "gemini") {
    return (
      process.env.GEMINI_MODEL ||
      process.env.GOOGLE_MODEL ||
      process.env.AI_MODEL ||
      DEFAULT_GEMINI_MODEL
    );
  }

  if (provider === "deepseek") {
    return (
      process.env.DEEPSEEK_MODEL ||
      process.env.AI_MODEL ||
      process.env.OPENAI_MODEL ||
      DEFAULT_DEEPSEEK_MODEL
    );
  }

  return process.env.AI_MODEL || DEFAULT_GEMINI_MODEL;
};

const normalizeEmailProvider = (providerName) => {
  const normalizedProviderName = String(providerName || DEFAULT_EMAIL_PROVIDER)
    .trim()
    .toLowerCase();

  if (["resend", "resend-email"].includes(normalizedProviderName)) {
    return "resend";
  }

  return normalizedProviderName;
};

const provider = normalizeProvider(process.env.LLM_PROVIDER);
const emailProvider = normalizeEmailProvider(process.env.EMAIL_PROVIDER);
const runtimeOtpSecret =
  process.env.AUTH_OTP_SECRET || crypto.randomBytes(32).toString("hex");

const config = {
  provider,
  emailProvider,
  host: process.env.HOST || (process.env.RENDER ? "0.0.0.0" : "127.0.0.1"),
  port: Number.parseInt(process.env.PORT || `${DEFAULT_PORT}`, 10) || DEFAULT_PORT,
  apiKey: getProviderApiKey(provider),
  model: getProviderModel(provider),
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
  resendApiKey: process.env.RESEND_API_KEY || "",
  authEmailFrom: process.env.AUTH_EMAIL_FROM || "",
  authOtpSecret: runtimeOtpSecret,
  hasStaticOtpSecret: Boolean(process.env.AUTH_OTP_SECRET),
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

const sanitizeName = (value) => String(value || "").trim();

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

const validateAuthPayload = (payload) => {
  const name = sanitizeName(payload?.name);
  const email = normalizeEmail(payload?.email);

  if (name.length < 2) {
    throw createHttpError("Укажите имя длиной не меньше 2 символов.", 400);
  }

  if (!isValidEmail(email)) {
    throw createHttpError("Введите корректную почту.", 400);
  }

  return {
    name,
    email,
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

const hashOtpCode = (email, code) =>
  crypto
    .createHmac("sha256", config.authOtpSecret)
    .update(`${normalizeEmail(email)}:${String(code).trim()}`)
    .digest("hex");

const isHashMatch = (firstHash, secondHash) => {
  const firstBuffer = Buffer.from(String(firstHash || ""), "hex");
  const secondBuffer = Buffer.from(String(secondHash || ""), "hex");

  return (
    firstBuffer.length === secondBuffer.length &&
    crypto.timingSafeEqual(firstBuffer, secondBuffer)
  );
};

const requireDatabase = () => {
  if (config.databaseUrlError) {
    throw createHttpError(config.databaseUrlError, 500);
  }

  if (!pool) {
    throw createHttpError("База данных не настроена. Добавьте DATABASE_URL.", 500);
  }
};

const requireResendEmail = () => {
  if (config.emailProvider !== "resend") {
    throw createHttpError(
      `Email-провайдер ${config.emailProvider} не поддерживается.`,
      500,
    );
  }

  if (!config.resendApiKey || !config.authEmailFrom) {
    throw createHttpError(
      "Resend не настроен. Добавьте RESEND_API_KEY и AUTH_EMAIL_FROM.",
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
      phone TEXT,
      email TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login TIMESTAMPTZ
    );

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email TEXT;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone TEXT;

    UPDATE users
    SET email = LOWER(TRIM(email))
    WHERE email IS NOT NULL;

    UPDATE users
    SET email = id || '@budget.local'
    WHERE email IS NULL OR TRIM(email) = '';

    WITH duplicated_user_emails AS (
      SELECT email
      FROM users
      WHERE email IS NOT NULL
      GROUP BY email
      HAVING COUNT(*) > 1
    )
    UPDATE users
    SET email = id || '@budget.local'
    WHERE email IN (SELECT email FROM duplicated_user_emails);

    ALTER TABLE users
      ALTER COLUMN email SET NOT NULL;

    ALTER TABLE users
      ALTER COLUMN phone DROP NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
      ON users (email);

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

    CREATE TABLE IF NOT EXISTS auth_email_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS auth_email_codes_email_created_at_idx
      ON auth_email_codes (email, created_at DESC);

    CREATE INDEX IF NOT EXISTS auth_email_codes_expires_at_idx
      ON auth_email_codes (expires_at);

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

const deleteExpiredEmailCodes = async () => {
  if (!pool) {
    return;
  }

  await pool.query(`
    DELETE FROM auth_email_codes
    WHERE expires_at <= NOW()
      OR consumed_at IS NOT NULL
  `);
};

const mapUserRecord = (row) => ({
  id: row.id,
  login: row.login,
  email: row.email,
  avatarUrl: row.avatar_url || undefined,
  name: row.name,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  lastLogin:
    row.last_login instanceof Date
      ? row.last_login.toISOString()
      : row.last_login || undefined,
});

const findOrCreateUser = async ({ name, email }) => {
  requireDatabase();

  const existingUserResult = await pool.query(
    `
      SELECT *
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
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
      INSERT INTO users (id, name, login, email, created_at, last_login)
      VALUES ($1, $2, $2, $3, NOW(), NOW())
      RETURNING *
    `,
    [
      `user_${crypto.randomUUID()}`,
      name,
      email,
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

const parseAmountFromText = (value = "") => {
  const normalizedValue = String(value).replace(/\s/g, "").replace(",", ".");
  const amountMatch = normalizedValue.match(/\d+(?:\.\d+)?/);

  return Math.max(0, Math.round(Number(amountMatch?.[0]) || 0));
};

const parseBudgetDate = (value) => {
  const date = new Date(`${String(value || "").slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getPeriodDays = (period = {}) => {
  const startDate = parseBudgetDate(period.startDate);
  const endDate = parseBudgetDate(period.endDate);

  if (!startDate || !endDate || endDate < startDate) {
    return 0;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((endDate.getTime() - startDate.getTime()) / dayMs) + 1;
};

const divideAmountByDays = (amount, days) =>
  days > 0 ? Math.round(amount / days) : 0;

const hasMeaningfulInputItem = (item = {}) =>
  Boolean(
    normalizeAiText(item.text) ||
      normalizeAiText(item.comment) ||
      Math.max(0, Number(item.amount) || 0) > 0,
  );

const getMeaningfulItems = (items = []) =>
  Array.isArray(items) ? items.filter(hasMeaningfulInputItem) : [];

const countMeaningfulItems = (sections = {}) =>
  Object.values(sections).reduce(
    (count, items) => count + getMeaningfulItems(items).length,
    0,
  );

const getContextItemsCount = (sections = {}) =>
  ["assets", "debts", "goals"].reduce(
    (count, key) => count + getMeaningfulItems(sections[key]).length,
    0,
  );

const getAiNotesLimit = (payload = {}) => {
  const meaningfulItemsCount = countMeaningfulItems(payload.sections);
  const contextItemsCount = getContextItemsCount(payload.sections);

  if (meaningfulItemsCount <= 4 && contextItemsCount === 0) {
    return SIMPLE_AI_NOTES_LIMIT;
  }

  if (meaningfulItemsCount <= 8 && contextItemsCount <= 1) {
    return DEFAULT_AI_NOTES_LIMIT;
  }

  return RICH_AI_NOTES_LIMIT;
};

const hasExpenseMatch = (items = [], pattern) =>
  getMeaningfulItems(items).some((item) =>
    pattern.test(`${item.text || ""} ${item.comment || ""}`.toLowerCase()),
  );

const hasEverydayExpenses = (sections = {}) => {
  const everydayExpensePattern =
    /(еда|продукт|питан|обед|ужин|кафе|кофе|транспорт|проезд|метро|автобус|такси|бензин|топлив|быт|аптек|лекарств)/i;
  return hasExpenseMatch(
    [...(sections.required || []), ...(sections.desired || [])],
    everydayExpensePattern,
  );
};

const hasReplacementCharacter = (value) => String(value || "").includes("\uFFFD");

const normalizeAiText = (value, options = {}) => {
  const rawValue = String(value || "");

  if (options.dropInvalid && hasReplacementCharacter(rawValue)) {
    return "";
  }

  return rawValue
    .normalize("NFC")
    .replace(/\uFFFD+/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t\r\n]+/g, " ")
    .trim();
};

const normalizeAiTextList = (items = [], limit) => {
  const seenNotes = new Set();

  return items
    .map((item) => normalizeAiText(item, { dropInvalid: true }))
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();

      if (seenNotes.has(key)) {
        return false;
      }

      seenNotes.add(key);
      return true;
    })
    .slice(0, limit);
};

const normalizeInputItem = (item = {}) => ({
  text: normalizeAiText(item.text),
  amount: Math.max(0, Math.round(Number(item.amount) || 0)),
  comment: normalizeAiText(item.comment),
  date: normalizeAiText(item.date),
  badge: normalizePlanItemBadge(item.badge),
});

const RUSSIAN_MONTHS = {
  января: 0,
  январь: 0,
  февраля: 1,
  февраль: 1,
  марта: 2,
  март: 2,
  апреля: 3,
  апрель: 3,
  мая: 4,
  май: 4,
  июня: 5,
  июнь: 5,
  июля: 6,
  июль: 6,
  августа: 7,
  август: 7,
  сентября: 8,
  сентябрь: 8,
  октября: 9,
  октябрь: 9,
  ноября: 10,
  ноябрь: 10,
  декабря: 11,
  декабрь: 11,
};

const createUtcDate = (year, monthIndex, day) =>
  new Date(Date.UTC(year, monthIndex, day));

const getContextDateYear = (monthIndex, period = {}) => {
  const periodStart = parseBudgetDate(period.startDate);
  const baseYear = periodStart
    ? periodStart.getUTCFullYear()
    : new Date().getUTCFullYear();
  const startMonthIndex = periodStart ? periodStart.getUTCMonth() : monthIndex;

  if (startMonthIndex >= 10 && monthIndex <= 1) {
    return baseYear + 1;
  }

  return baseYear;
};

const parseContextDateFromText = (value, period = {}) => {
  const text = normalizeAiText(value).toLowerCase();

  if (!text) {
    return null;
  }

  const isoMatch = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    return createUtcDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
    );
  }

  const numericMatch = text.match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](20\d{2}))?\b/);
  if (numericMatch) {
    const monthIndex = Number(numericMatch[2]) - 1;
    const year = numericMatch[3]
      ? Number(numericMatch[3])
      : getContextDateYear(monthIndex, period);

    return createUtcDate(year, monthIndex, Number(numericMatch[1]));
  }

  const monthNames = Object.keys(RUSSIAN_MONTHS).join("|");
  const russianDateMatch = text.match(
    new RegExp(`\\b(\\d{1,2})\\s+(${monthNames})(?:\\s+(20\\d{2}))?\\b`, "i"),
  );
  if (russianDateMatch) {
    const monthIndex = RUSSIAN_MONTHS[russianDateMatch[2].toLowerCase()];
    const year = russianDateMatch[3]
      ? Number(russianDateMatch[3])
      : getContextDateYear(monthIndex, period);

    return createUtcDate(year, monthIndex, Number(russianDateMatch[1]));
  }

  return null;
};

const getItemContextDate = (item = {}, period = {}) =>
  parseContextDateFromText(
    `${item.text || ""} ${item.comment || ""} ${item.date || ""}`,
    period,
  );

const isAfterBudgetPeriod = (date, period = {}) => {
  const periodEnd = parseBudgetDate(period.endDate);

  return Boolean(date && periodEnd && date.getTime() > periodEnd.getTime());
};

const isDebtOutsideBudgetPlan = (debt = {}, period = {}) => {
  const dueDate = getItemContextDate(debt, period);

  return !dueDate || isAfterBudgetPeriod(dueDate, period);
};

const normalizeSearchText = (value) =>
  normalizeAiText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const doesPlanItemMatchInputItem = (planItem = {}, inputItem = {}) => {
  const planTitle = normalizeSearchText(planItem.title);
  const inputText = normalizeSearchText(inputItem.text);
  const inputTokens = inputText
    .split(" ")
    .filter((token) => token.length >= 3);
  const hasTextMatch = inputTokens.some((token) => planTitle.includes(token));
  const hasAmountMatch =
    inputItem.amount > 0 && Math.abs(planItem.amount - inputItem.amount) <= 1;

  return inputTokens.length > 0 ? hasTextMatch : hasAmountMatch;
};

const isDebtLikeInputItem = (item = {}) => {
  const itemText = normalizeSearchText(`${item.text || ""} ${item.comment || ""}`);

  return (
    item.badge === "debt" ||
    /\b(долг|долж|вернуть|платеж|платёж|погас)\b/i.test(itemText)
  );
};

const getDebtContextItems = (requestPayload = {}) =>
  [
    ...getMeaningfulItems(requestPayload.sections?.debts),
    ...getMeaningfulItems(requestPayload.sections?.required).filter(
      isDebtLikeInputItem,
    ),
    ...getMeaningfulItems(requestPayload.sections?.desired).filter(
      isDebtLikeInputItem,
    ),
  ];

const shouldKeepPlanItem = (planItem = {}, requestPayload = {}) => {
  if (!planItem.title || planItem.amount <= 0) {
    return false;
  }

  if (planItem.badge !== "debt") {
    return true;
  }

  const outsidePlanDebt = getDebtContextItems(requestPayload)
    .filter((debt) => isDebtOutsideBudgetPlan(debt, requestPayload.period))
    .find((debt) => doesPlanItemMatchInputItem(planItem, debt));

  return !outsidePlanDebt;
};

const formatShortDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

const formatRubles = (amount) =>
  `${Math.round(Number(amount) || 0).toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`;

const buildOutOfPeriodDebtReminders = (requestPayload = {}) =>
  getDebtContextItems(requestPayload)
    .map((debt) => ({
      debt,
      dueDate: getItemContextDate(debt, requestPayload.period),
    }))
    .filter(({ dueDate }) => !dueDate || isAfterBudgetPeriod(dueDate, requestPayload.period))
    .map(({ debt, dueDate }) => {
      const title = debt.text ? `Долг ${debt.text}` : "Долг";
      const amount = debt.amount > 0 ? ` ${formatRubles(debt.amount)}` : "";

      if (!dueDate) {
        return `${title}${amount} без срока. Уточни дату платежа перед следующим обновлением плана.`;
      }

      return `${title}${amount} на ${formatShortDate(dueDate)} не входит в этот период. Запланируй его в следующем бюджете.`;
    });

const isOutOfPeriodDebtNote = (value, requestPayload = {}) => {
  const noteText = normalizeSearchText(value);

  return getDebtContextItems(requestPayload)
    .filter((debt) => isDebtOutsideBudgetPlan(debt, requestPayload.period))
    .some((debt) => {
      const debtTokens = normalizeSearchText(debt.text)
        .split(" ")
        .filter((token) => token.length >= 3);
      const noteDigits = noteText.replace(/\D/g, "");
      const debtAmountDigits = String(Math.round(debt.amount));
      const hasTextMatch = debtTokens.some((token) => noteText.includes(token));
      const hasAmountMatch =
        debt.amount > 0 && noteDigits.includes(debtAmountDigits);
      const isDebtLikeNote =
        /\b(долг|долж|вернуть|платеж|платёж|погас)\b/i.test(noteText);

      return hasTextMatch || (hasAmountMatch && isDebtLikeNote);
    });
};

const isCalculatedLikeNote = (value) => {
  const text = normalizeAiText(value).toLowerCase();
  const hasCalculationKeyword =
    /(свободн|дефицит|остает|остат|резерв|доступн|комфорт)/i.test(text);
  const hasLimitKeyword = /(день|недел|после|лимит)/i.test(text);
  const hasEverydayExpenseKeyword =
    /(еда|продукт|транспорт|быт|бытов|проезд|метро|такси)/i.test(text);

  return (
    (hasCalculationKeyword && hasLimitKeyword) ||
    (hasEverydayExpenseKeyword && hasLimitKeyword)
  );
};

const normalizePlanItemBadge = (value) => {
  const normalizedBadge = normalizeAiText(value).toLowerCase();

  return ["debt", "goal"].includes(normalizedBadge)
    ? normalizedBadge
    : undefined;
};

const normalizePlanItem = (item = {}) => ({
  title: normalizeAiText(item.title),
  amount: Math.max(0, Math.round(Number(item.amount) || 0)),
  priority: Boolean(item.priority),
  badge: normalizePlanItemBadge(item.badge),
  date: normalizeAiText(item.date || item.dueDate || item.deadline),
});

const normalizePlan = (plan = {}, requestPayload) => {
  const notesLimit = getAiNotesLimit(requestPayload);
  const normalizedPlan = {
    summary: normalizeAiText(plan.summary),
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
    notes: normalizeAiTextList(
      [
        ...buildOutOfPeriodDebtReminders(requestPayload),
        ...(Array.isArray(plan.notes) ? plan.notes : []).filter(
          (note) => !isOutOfPeriodDebtNote(note, requestPayload),
        ),
      ].filter((note) => !isCalculatedLikeNote(note)),
      notesLimit,
    ),
    warnings: Array.isArray(plan.warnings)
      ? normalizeAiTextList(
          plan.warnings.filter(
            (warning) => !isOutOfPeriodDebtNote(warning, requestPayload),
          ),
          MAX_AI_WARNINGS,
        )
      : [],
  };

  normalizedPlan.requiredItems = normalizedPlan.requiredItems.filter((item) =>
    shouldKeepPlanItem(item, requestPayload),
  );
  normalizedPlan.desiredItems = normalizedPlan.desiredItems.filter((item) =>
    shouldKeepPlanItem(item, requestPayload),
  );

  if (!normalizedPlan.summary) {
    throw createHttpError("Ответ ИИ не содержит summary.", 502);
  }

  if (
    normalizedPlan.requiredItems.length === 0 &&
    normalizedPlan.desiredItems.length === 0
  ) {
    throw createHttpError("Ответ ИИ не содержит пункты бюджета.", 502);
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
    city: normalizeAiText(payload.city),
    dailySpending: normalizeAiText(payload.dailySpending),
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

  if (!Array.isArray(payload?.sections?.required) || payload.sections.required.length === 0) {
    throw createHttpError("At least one required expense item is required.", 400);
  }
};

const buildSystemPrompt = () => `
Ты финансовый ИИ-планировщик для русскоязычного приложения по ведению бюджета.

Твоя задача:
- на основе данных пользователя составить реалистичный, структурированный и лаконичный план бюджета;
- распределить траты по двум категориям: обязательные и необязательные, с конкретными суммами;
- уважать ограничение по доходу, если это возможно;
- если обязательные траты уже превышают доход, сохранить важные обязательные траты и явно предупредить о дефиците в warnings;
- использовать активы, долги, цели и свободный комментарий пользователя для приоритизации и рекомендаций;
- писать на русском языке;
- обращаться к пользователю на "ты"; не использовать "вы", "ваш", "рассмотрите";
- делать названия пунктов короткими и удобными для UI карточек;
- если у пункта есть срок, верни его в поле date и не дублируй срок в title;
- добавляй срок в title только если без него непонятно, какой это платеж и поле date не подходит;
- date бери только из данных пользователя; не придумывай сроки;
- не предлагай новые источники дохода и не создавай доходные операции, которых нет во входных данных;
- не добавлять комментариев вне JSON.

Правила качества плана:
- обязательные траты должны покрывать критически важные потребности и регулярные платежи;
- не урезай обязательные расходы пользователя, кроме явных дублей или ошибок;
- если обязательные траты превышают доход, desiredItems можно урезать до 0, а reserveAmount может быть отрицательным;
- еда, транспорт, лекарства и бытовые мелочи не создаются отдельными пунктами, если пользователь не указал их явно;
- если пользователь указал дневные траты, используй это только как контекст комфорта пользователя, а не как отдельный расход или отдельный расчет в notes;
- не создавай отдельные расчеты свободных денег, дневных или недельных лимитов: приложение делает это автоматически;
- при повторном обновлении sections.required и sections.desired уже содержат текущие пункты плана; верни полный обновленный список requiredItems и desiredItems, а не только новые пункты;
- если текущий пункт в required или desired содержит badge или слова "цель", "долг", "актив", обработай его по тем же правилам, что данные из отдельных блоков формы;
- добавляй долг в requiredItems только если срок возврата попадает в период бюджета;
- если срок долга позже конца периода или срок не указан, не добавляй его в requiredItems, desiredItems, notes или warnings. Такие долги обрабатывает сервер отдельным напоминанием;
- для пунктов, созданных из долгов, добавляй badge: "debt";
- если долг попал в requiredItems, укажи получателя в title, а срок платежа вынеси в date;
- если цель пришла из sections.goals или текущего пункта без badge со словом "цель", считай amount желаемой суммой цели, а не готовым расходом этого периода;
- если текущий пункт уже имеет badge: "goal", считай amount текущим запланированным взносом; корректируй его только если изменились доход, обязательные траты или период;
- посильный взнос по цели не должен превышать остаток после обязательных расходов и уже выбранных необязательных трат;
- если остатка мало, уменьши взнос до реалистичной суммы или не добавляй цель в items;
- для цели вне периода рассчитай посильный взнос именно на текущий период и верни его amount в desiredItems; не оставляй в пункте полную сумму цели, если ее нельзя разумно закрыть в текущем периоде;
- перенеси цель в requiredItems только если дедлайн попадает в период бюджета и после обязательных расходов хватает денег на взнос;
- для пунктов, созданных из целей, добавляй badge: "goal";
- добавляй notes по цели только если цель не удалось включить в items или если нужен перенос срока, уменьшение взноса или сокращение других трат;
- не повторяй цель в notes, если она уже понятно отражена в desiredItems или requiredItems;
- не используй формулировки "удалось отложить", "отложено", "уже накоплено"; пиши как совет: "можно выделить", "получится отложить", "лучше запланировать";
- не создавай requiredItems или desiredItems из активов; активы можно упоминать только в notes или warnings;
- добавляй notes по активам только при дефиците, нехватке денег на обязательные расходы или если пользователь сам просит использовать актив;
- если пользователь указал город, используй его только для оценки общей нагрузки бюджета, без конкретных цен, зарплат и статистики;
- необязательные траты можно сокращать, объединять или откладывать ради баланса;
- totals заполни числами по returned items. Не делай на основе totals отдельные notes или warnings. Сервер пересчитает totals после ответа;
- summary: один короткий вывод до 180 символов, без общих фраз, без расчета свободных денег, дневного или недельного лимита;
- notes добавляй только если они содержат новое действие, срок, ограничение или риск, которого нет в items, summary или warnings;
- каждый пункт notes должен содержать конкретное действие, дату, сумму или ограничение;
- warnings должны содержать только конкретные финансовые риски: дефицит, просрочку, нехватку денег на обязательные платежи или нестабильный доход, если это явно видно из данных. Не добавляй общие рекомендации;
- не повторяй одну и ту же мысль в summary, notes и warnings;
- если одна мысль уже есть в notes, не повторяй ее в warnings;
- не создавай несколько пунктов или заметок про один и тот же долг, цель, актив или расход, даже если они названы по-разному;
- priority ставь только для срочных или критичных пунктов; не помечай все обязательные пункты приоритетными автоматически;
- не пиши общие советы вроде "стоит добавить регулярные расходы", если можно дать расчет;
- не начинай title с "Долг:" или "Цель:"; принадлежность пункта передавай через badge;
- у пунктов requiredItems и desiredItems допустимы только поля title, amount, priority, badge, date;
- amount должен быть целым числом больше 0, всегда в рублях, без копеек и без символа ₽; не возвращай пустые title, null, строки вместо чисел или пункты с 0 ₽;
- badge можно опустить; если есть, он должен быть только "debt" или "goal";
- date можно опустить; если есть, он должен быть коротким сроком из данных пользователя: "май", "30 мая", "1 июня", без года, если год совпадает с периодом;
- не создавай дублирующиеся title или смысловые дубли: объедини похожие пункты;
- не используй emoji, markdown, кавычки-елочки, unicode-декор, символ � или декоративные знаки; допустимы обычная русская пунктуация, цифры, скобки, дефис, проценты и знак ₽.
- ответ должен быть только одним валидным json-объектом без markdown и пояснений вне json.
`.trim();

const buildUserPrompt = (payload) => {
  const notesLimit = getAiNotesLimit(payload);
  const totals = {
    periodDays: getPeriodDays(payload.period),
    incomeTotal: sumAmounts(payload.sections.income),
    requiredInputTotal: sumAmounts(payload.sections.required),
    desiredInputTotal: sumAmounts(payload.sections.desired),
    assetsTotal: sumAmounts(payload.sections.assets),
    debtsTotal: sumAmounts(payload.sections.debts),
    goalsTotal: sumAmounts(payload.sections.goals),
    dailySpending: payload.dailySpending,
    dailySpendingAmount: parseAmountFromText(payload.dailySpending),
    meaningfulItemsCount: countMeaningfulItems(payload.sections),
    contextItemsCount: getContextItemsCount(payload.sections),
    everydayExpensesAlreadyProvided: hasEverydayExpenses(payload.sections),
    hasCity: Boolean(payload.city),
    hasDailySpending: Boolean(payload.dailySpending),
    hasAssets: getMeaningfulItems(payload.sections.assets).length > 0,
    hasDebts: getMeaningfulItems(payload.sections.debts).length > 0,
    hasGoals: getMeaningfulItems(payload.sections.goals).length > 0,
  };
  totals.dailySpendingForPeriod = totals.dailySpendingAmount * totals.periodDays;
  totals.freeMoneyByInput =
    totals.incomeTotal - totals.requiredInputTotal - totals.desiredInputTotal;
  totals.freeMoneyByInputPerDay = divideAmountByDays(
    totals.freeMoneyByInput,
    totals.periodDays,
  );

  return [
    "Составь план бюджета на основе этих данных пользователя.",
    "Верни только валидный json-объект.",
    "Используй строго эти ключи верхнего уровня: summary, totals, requiredItems, desiredItems, notes, warnings.",
    "totals заполни числами по returned items, но не делай на их основе notes или warnings: сервер пересчитает totals после ответа.",
    `Максимум notes по этим данным: ${notesLimit}. Не добавляй notes ради количества.`,
    `В warnings верни не больше ${MAX_AI_WARNINGS} пунктов и только реальные риски.`,
    "Сначала собери полный обновленный список requiredItems и desiredItems. Не возвращай пункты с пустым title или amount 0.",
    "Если у пункта есть срок из данных пользователя, верни его в поле date, а title оставь коротким.",
    "Не добавляй отдельную notes про свободные деньги или дневной лимит: приложение рассчитает ее само.",
    "Не добавляй еду, транспорт, лекарства и бытовые мелочи в requiredItems или desiredItems, если пользователь не внес их как отдельные расходы. dailySpending используй только как контекст комфорта.",
    "Если city указан, используй его только как контекст нагрузки бюджета без точных средних цен или доходов.",
    "Если в текущих required или desired есть пункт со словом \"цель\", \"долг\", \"актив\" или badge, обработай его как цель, долг или актив даже если он был добавлен уже после формы.",
    "Если долг нужно вернуть внутри периода, добавь его в requiredItems с badge: \"debt\". Если срок позже конца периода или срок не указан, полностью пропусти этот долг: не добавляй его в items, notes или warnings.",
    "Если цель пришла из sections.goals или текущего пункта без badge со словом \"цель\", считай amount желаемой суммой цели и рассчитай посильный взнос на текущий период.",
    "Если текущий пункт уже имеет badge: \"goal\", считай amount текущим взносом, а не полной целью. Корректируй его только при изменении дохода, обязательных трат или периода.",
    "Посильный взнос по цели не должен превышать остаток после обязательных расходов и уже выбранных необязательных трат.",
    "Верни цель в desiredItems как посильный взнос. Переноси цель в requiredItems только если дедлайн попадает в период бюджета и после обязательных расходов хватает денег.",
    "Добавляй notes по цели только если цель не удалось включить в items или если нужен перенос срока, уменьшение взноса или сокращение других трат.",
    "В notes по цели используй формулировки \"можно выделить\", \"получится отложить\", \"лучше запланировать\". Не пиши \"удалось отложить\" или \"уже отложено\".",
    "Активы не превращай в requiredItems или desiredItems. Добавь notes по активам только при дефиците, нехватке денег на обязательные расходы или если пользователь сам просит использовать актив.",
    "Не создавай несколько пунктов или заметок про один и тот же долг, цель, актив или расход, даже если они названы по-разному.",
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

const postJson = (url, payload, headers = {}, options = {}) =>
  new Promise((resolve, reject) => {
    const targetUrl = new URL(url);
    const body = JSON.stringify(payload);
    const serviceName = options.serviceName || "Внешний сервис";

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
            reject(createHttpError(`${serviceName} вернул некорректный JSON.`, 502));
            return;
          }

          if ((upstreamResponse.statusCode || 500) >= 400) {
            const upstreamError = createHttpError(
              parsedResponse?.error?.message ||
                parsedResponse?.message ||
                `${serviceName} вернул ошибку.`,
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

  throw createHttpError("Ответ ИИ не содержит текст сообщения.", 502);
};

const getGeminiModelName = (model) =>
  String(model || DEFAULT_GEMINI_MODEL)
    .trim()
    .replace(/^models\//, "");

const buildGeminiGenerateContentUrl = (model) =>
  `${GEMINI_GENERATE_CONTENT_BASE_URL}/models/${encodeURIComponent(
    getGeminiModelName(model),
  )}:generateContent`;

const extractGeminiContentText = (providerResponse) => {
  const firstCandidate = Array.isArray(providerResponse?.candidates)
    ? providerResponse.candidates[0]
    : null;

  const parts = Array.isArray(firstCandidate?.content?.parts)
    ? firstCandidate.content.parts
    : [];

  const content = parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();

  if (content) {
    return content;
  }

  const blockReason =
    providerResponse?.promptFeedback?.blockReason ||
    firstCandidate?.finishReason ||
    "unknown";

  throw createHttpError(
    `Gemini response does not contain message content. Reason: ${blockReason}.`,
    502,
  );
};

const parseJsonPlanText = (rawPlanText) => {
  const cleanedPlanText = String(rawPlanText || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleanedPlanText);
  } catch (error) {
    const firstBraceIndex = cleanedPlanText.indexOf("{");
    const lastBraceIndex = cleanedPlanText.lastIndexOf("}");

    if (firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
      try {
        return JSON.parse(
          cleanedPlanText.slice(firstBraceIndex, lastBraceIndex + 1),
        );
      } catch (fallbackError) {
        throw createHttpError("ИИ-провайдер вернул некорректный JSON бюджета.", 502);
      }
    }

    throw createHttpError("ИИ-провайдер вернул некорректный JSON бюджета.", 502);
  }
};

const generateBudgetPlanWithDeepSeek = async (payload) => {
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

  const providerResponse = await postJson(
    DEEPSEEK_CHAT_COMPLETIONS_URL,
    providerRequest,
    {
      Authorization: `Bearer ${config.apiKey}`,
    },
    {
      serviceName: "ИИ-провайдер",
    },
  );

  const rawPlanText = extractChatCompletionText(providerResponse);
  return normalizePlan(parseJsonPlanText(rawPlanText), payload);
};

const generateBudgetPlanWithGemini = async (payload) => {
  const providerRequest = {
    systemInstruction: {
      parts: [
        {
          text: buildSystemPrompt(),
        },
      ],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildUserPrompt(payload),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  const providerResponse = await postJson(
    buildGeminiGenerateContentUrl(config.model),
    providerRequest,
    {
      "x-goog-api-key": config.apiKey,
    },
    {
      serviceName: "ИИ-провайдер",
    },
  );

  const rawPlanText = extractGeminiContentText(providerResponse);
  return normalizePlan(parseJsonPlanText(rawPlanText), payload);
};

const generateBudgetPlan = async (payload) => {
  if (!config.apiKey) {
    throw createHttpError(
      `${config.provider} API key is not configured.`,
      500,
    );
  }

  if (config.provider === "gemini") {
    return generateBudgetPlanWithGemini(payload);
  }

  if (config.provider === "deepseek") {
    return generateBudgetPlanWithDeepSeek(payload);
  }

  throw createHttpError(`Неподдерживаемый ИИ-провайдер: ${config.provider}.`, 500);
};

const generateOtpCode = () =>
  crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildOtpEmailHtml = ({ name, code }) => `
  <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5;">
    <p>Привет, ${escapeHtml(name)}.</p>
    <p>Код для входа в Budget Planner:</p>
    <p style="font-size: 28px; letter-spacing: 6px; margin: 20px 0;"><strong>${code}</strong></p>
    <p>Он действует 10 минут. Если это была не ты, просто проигнорируй это письмо.</p>
  </div>
`.trim();

const buildOtpEmailText = ({ name, code }) =>
  [
    `Привет, ${name}.`,
    "",
    `Код для входа в Budget Planner: ${code}`,
    "",
    "Он действует 10 минут. Если это была не ты, просто проигнорируй это письмо.",
  ].join("\n");

const sendOtpEmail = async ({ email, name, code }) => {
  requireResendEmail();

  await postJson(
    RESEND_EMAILS_URL,
    {
      from: config.authEmailFrom,
      to: [email],
      subject: "Код для входа в Budget Planner",
      html: buildOtpEmailHtml({ name, code }),
      text: buildOtpEmailText({ name, code }),
    },
    {
      Authorization: `Bearer ${config.resendApiKey}`,
      "User-Agent": "budget-planner/1.0",
    },
    {
      serviceName: "Resend",
    },
  );
};

const requestEmailVerification = async ({ name, email }) => {
  requireDatabase();
  requireResendEmail();

  await deleteExpiredEmailCodes();

  const cooldownResult = await pool.query(
    `
      SELECT created_at
      FROM auth_email_codes
      WHERE email = $1
        AND consumed_at IS NULL
        AND created_at > NOW() - ($2::int * INTERVAL '1 millisecond')
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [email, OTP_RESEND_COOLDOWN_MS],
  );

  if (cooldownResult.rows[0]) {
    throw createHttpError(
      "Код уже отправлен. Попробуйте еще раз через минуту.",
      429,
    );
  }

  await pool.query(
    `
      UPDATE auth_email_codes
      SET consumed_at = NOW()
      WHERE email = $1
        AND consumed_at IS NULL
    `,
    [email],
  );

  const code = generateOtpCode();
  const codeId = `otp_${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await pool.query(
    `
      INSERT INTO auth_email_codes (id, email, code_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [codeId, email, hashOtpCode(email, code), expiresAt],
  );

  try {
    await sendOtpEmail({ email, name, code });
  } catch (error) {
    await pool.query(
      `
        DELETE FROM auth_email_codes
        WHERE id = $1
      `,
      [codeId],
    );

    throw createHttpError(
      error?.message || "Не удалось отправить код на почту.",
      error?.statusCode || error?.status || 502,
    );
  }

  return expiresAt;
};

const verifyEmailCode = async ({ email, code }) => {
  requireDatabase();

  const verificationResult = await pool.query(
    `
      SELECT *
      FROM auth_email_codes
      WHERE email = $1
        AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [email],
  );

  const verification = verificationResult.rows[0];

  if (!verification) {
    throw createHttpError("Запросите новый код для входа.", 400);
  }

  if (new Date(verification.expires_at).getTime() <= Date.now()) {
    await pool.query(
      `
        DELETE FROM auth_email_codes
        WHERE id = $1
      `,
      [verification.id],
    );

    throw createHttpError("Код устарел. Запросите новый код.", 400);
  }

  if (verification.attempts >= OTP_MAX_ATTEMPTS) {
    await pool.query(
      `
        UPDATE auth_email_codes
        SET consumed_at = NOW()
        WHERE id = $1
      `,
      [verification.id],
    );

    throw createHttpError("Слишком много попыток. Запросите новый код.", 429);
  }

  if (!isHashMatch(verification.code_hash, hashOtpCode(email, code))) {
    const nextAttempts = verification.attempts + 1;

    await pool.query(
      `
        UPDATE auth_email_codes
        SET
          attempts = $2,
          consumed_at = CASE WHEN $2 >= $3 THEN NOW() ELSE consumed_at END
        WHERE id = $1
      `,
      [verification.id, nextAttempts, OTP_MAX_ATTEMPTS],
    );

    throw createHttpError("Код не подошел. Попробуйте еще раз.", 400);
  }

  await pool.query(
    `
      UPDATE auth_email_codes
      SET consumed_at = NOW()
      WHERE id = $1
    `,
    [verification.id],
  );
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
      authProvider:
        config.emailProvider === "resend" &&
        config.resendApiKey &&
        config.authEmailFrom
          ? "resend-email"
          : "not_configured",
      emailProvider: config.emailProvider,
    },
    timestamp: new Date().toISOString(),
  });
};

const handleAuthRequestCode = async (request, response) => {
  const requestBody = await readJsonBody(request);
  const { name, email } = validateAuthPayload(requestBody);

  const expiresAt = await requestEmailVerification({ name, email });

  sendJson(request, response, 200, {
    success: true,
    data: {
      email,
      name,
      expiresAt: expiresAt.toISOString(),
    },
    timestamp: new Date().toISOString(),
  });
};

const handleAuthVerifyCode = async (request, response) => {
  const requestBody = await readJsonBody(request);
  const { name, email } = validateAuthPayload(requestBody);
  const code = validateOtpCode(requestBody?.code);

  await verifyEmailCode({ email, code });

  const userRecord = await findOrCreateUser({
    name,
    email,
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
    await deleteExpiredEmailCodes();
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
        "[budget-planner-backend] ИИ API key is missing. Generation will fail until you add it to backend/.env.",
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

    if (config.emailProvider !== "resend" || !config.resendApiKey || !config.authEmailFrom) {
      console.warn(
        "[budget-planner-backend] Resend email auth is not configured. Email verification will be unavailable.",
      );
    }

    if (!config.hasStaticOtpSecret) {
      console.warn(
        "[budget-planner-backend] AUTH_OTP_SECRET is missing. Pending email codes will reset after server restart.",
      );
    }

    void initializeDatabaseSchema();
  });
};

startServer().catch((error) => {
  console.error("[budget-planner-backend] Failed to start server:", error);
  process.exit(1);
});
