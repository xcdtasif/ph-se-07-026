import path from "path"

import dotenv from "dotenv"

import type { ExpiresIn } from "../utils/jwt.js"

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

function getEnvAsExpiresIn(key: string): ExpiresIn {
  const value = getEnv(key)

  if (!/^\d+[smhd]$/.test(value)) {
    throw new Error(`Environment variable ${key} must look like "15m", "7d", "30s" or "2h"`)
  }

  return value as ExpiresIn
}

const nodeEnv = getEnv("NODE_ENV")
const validNodeEnv = ["development", "production"]

if (!validNodeEnv.includes(nodeEnv)) {
  throw new Error(`Invalid NODE_ENV: ${nodeEnv}`)
}

export const env = {
  NODE_ENV: getEnv("NODE_ENV"),
  PORT: getEnvAsNumber("PORT"),
  CLIENT_URL: getEnv("CLIENT_URL"),

  DATABASE_URL: getEnv("DATABASE_URL"),
  DATABASE_URL_UNPOOLED: getEnv("DATABASE_URL_UNPOOLED"),

  BCRYPT_SALT_ROUNDS: getEnvAsNumber("BCRYPT_SALT_ROUNDS"),

  JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET"),
  JWT_ACCESS_TOKEN_EXPIRES_IN: getEnvAsExpiresIn("JWT_ACCESS_TOKEN_EXPIRES_IN"),
  JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
  JWT_REFRESH_TOKEN_EXPIRES_IN: getEnvAsExpiresIn("JWT_REFRESH_TOKEN_EXPIRES_IN"),

  STRIPE_SECRET_KEY: getEnv("STRIPE_SECRET_KEY"),
  STRIPE_PRODUCT_PRICE_ID: getEnv("STRIPE_PRODUCT_PRICE_ID"),
  STRIPE_WEBHOOK_SECRET: getEnv("STRIPE_WEBHOOK_SECRET"),
} as const
