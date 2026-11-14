import type { Prisma } from "../../generated/prisma/client.js"

/*
A property is shown to the public and open to new requests only while it isn't hidden by an admin
and its landlord isn't banned. Nothing is written on a ban, so unbanning restores the listings.
*/
export const visiblePropertyWhere: Prisma.PropertyWhereInput = {
  isHidden: false,
  landlord: { isBanned: false },
}
