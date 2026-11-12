import type { Prisma } from "../../generated/prisma/client.js"

/*
A property is shown to the public and open to new requests only while it is not hidden by an admin
and its landlord is not banned. Nothing is written on a ban, so unbanning restores the listings.
*/
export const visiblePropertyWhere: Prisma.PropertyWhereInput = {
  isHidden: false,
  landlord: { isBanned: false },
}
