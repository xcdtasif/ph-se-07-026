import { seedUsersWithRole } from "../utils/seed-users.js"

export const TENANTS = [
  { name: "Tenant 01", email: "tenant01@gmail.com" },
  { name: "Tenant 02", email: "tenant02@gmail.com" },
  { name: "Tenant 03", email: "tenant03@gmail.com" },
]

export const BANNED_TENANT = { name: "Tenant 04", email: "tenant04@gmail.com", isBanned: true }

export const seedTenants = () =>
  seedUsersWithRole([...TENANTS, BANNED_TENANT], "TENANT", "tenant", "tenants")
