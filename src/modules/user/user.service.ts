import httpStatus from "http-status"

import type { Prisma } from "../../generated/prisma/client.js"
import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"
import type { UpdateMePayload, UpdateUserStatusPayload, UserListQuery } from "./user.schema.js"

const updateMe = (id: string, payload: UpdateMePayload) => {
  return prisma.user.update({ where: { id }, data: payload, omit: { password: true } })
}

const getAllUsers = async (query: UserListQuery) => {
  const { page, limit, search, role, isBanned } = query

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(isBanned !== undefined ? { isBanned } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      omit: { password: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return { users, meta: { page, limit, total } }
}

const updateUserStatus = async (id: string, payload: UpdateUserStatusPayload) => {
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } })

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found")
  }

  /*
  Admins can never be banned, which also stops an admin from banning themselves. A role never
  changes after registration, so this check cannot race with the update below.
  */
  if (user.role === "ADMIN") {
    throw new AppError(httpStatus.FORBIDDEN, "Admin accounts cannot be banned")
  }

  return prisma.user.update({ where: { id }, data: payload, omit: { password: true } })
}

export const userService = { updateMe, getAllUsers, updateUserStatus }
