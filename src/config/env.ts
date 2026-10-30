import path from "path"

import dotenv from "dotenv"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getEnvAsNumber(key: string): number {
  const value = Number(getEnv(key))
  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${key} must be a valid number`)
  }
  return value
}

const nodeEnv = getEnv("NODE_ENV")
const validNodeEnv = ["development", "production"]

if (!validNodeEnv.includes(nodeEnv)) {
  throw new Error(`Invalid NODE_ENV: ${nodeEnv}`)
}

export const env = {
  nodeEnv: getEnv("NODE_ENV"),
  port: getEnvAsNumber("PORT"),

  databaseUrl: getEnv("DATABASE_URL"),
  databaseUrlUnpooled: getEnv("DATABASE_URL_UNPOOLED"),

  // jwtAccessSecret: getEnv("JWT_ACCESS_SECRET"),
  // jwtAccessTokenExpiresIn: getEnv("JWT_ACCESS_TOKEN_EXPIRES_IN"),
  // jwtRefreshSecret: getEnv("JWT_REFRESH_SECRET"),
  // jwtRefreshTokenExpiresIn: getEnv("JWT_REFRESH_TOKEN_EXPIRES_IN"),

  // bcryptSaltRounds: getEnvAsNumber("BCRYPT_SALT_ROUNDS"),

  // stripeSecretKey: getEnv("STRIPE_SECRET_KEY"),
  // stripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET"),
  // stripeProductPriceId: getEnv("STRIPE_PRODUCT_PRICE_ID"),
} as const
