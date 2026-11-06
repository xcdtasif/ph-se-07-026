import { seedUsersWithRole } from "../utils/seed-users.js"

export const LANDLORDS = [
  { name: "Landlord 01", email: "landlord01@gmail.com" },
  { name: "Landlord 02", email: "landlord02@gmail.com" },
  { name: "Landlord 03", email: "landlord03@gmail.com" },
]

export const seedLandlords = () => seedUsersWithRole(LANDLORDS, "LANDLORD", "landlord", "landlords")
