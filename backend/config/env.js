import "dotenv/config";

/**
 * Central, validated configuration.
 *
 * Reading `process.env` directly at each call site means a missing variable
 * surfaces as a confusing runtime failure deep inside a request (an undefined
 * JWT secret, for example, makes every token verification throw). Resolving it
 * once here fails fast at boot with a message that names the variable.
 */
const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. See .env.example.`,
    );
  }
  return value;
};

const optional = (key, fallback) => process.env[key] ?? fallback;

export const config = {
  env: optional("NODE_ENV", "development"),
  port: Number(optional("PORT", 3000)),
  jwt: {
    secret: required("JWT_SECRET"),
    // Kept at the previous value so existing sessions behave identically.
    expiresIn: optional("JWT_EXPIRES_IN", "1h"),
    cookieMaxAge: Number(optional("JWT_COOKIE_MAX_AGE", 3600000)),
  },
  db: {
    host: optional("DB_HOST", "127.0.0.1"),
    port: Number(optional("DB_PORT", 3306)),
    user: required("DB_USER"),
    password: optional("DB_PASSWORD", ""),
    database: optional("DB_NAME", "resume_builder"),
    connectionLimit: Number(optional("DB_POOL_SIZE", 10)),
  },
  corsOrigin: optional("CORS_ORIGIN", "http://localhost:5173"),
};

export const isProduction = config.env === "production";
