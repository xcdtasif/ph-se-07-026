import type { ExpiresIn } from "./jwt.js"

const UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const

export const toMs = (value: ExpiresIn): number => {
  if (typeof value === "number") {
    return value * 1000
  }

  const match = /^(\d+)([smhd])$/.exec(value)

  if (!match) {
    throw new Error(`Unsupported expiresIn value: ${value}`)
  }

  const [, amount, unit] = match

  return Number(amount) * UNIT_MS[unit as keyof typeof UNIT_MS]
}
