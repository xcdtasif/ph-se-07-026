import { seedUsersWithRole } from "../utils/seed-users.js"

const TENANTS = [
  { name: "Tenant 01", email: "tenant01@gmail.com" },
  { name: "Tenant 02", email: "tenant02@gmail.com" },
  { name: "Tenant 03", email: "tenant03@gmail.com" },
]

export const seedTenants = () => seedUsersWithRole(TENANTS, "TENANT", "tenant", "tenants")
