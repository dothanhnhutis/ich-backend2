import prisma from "@/utils/db";
import { Prisma } from "@prisma/client";

export const userSelectDefault: Prisma.UserSelect = {
  id: true,
  email: true,
  role: true,
  username: true,
  phone: true,
  picture: true,
  address: true,
  createdAt: true,
  updatedAt: true,
};

export async function getUserByEmail(
  email: string,
  select?: Prisma.UserSelect
) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: Prisma.validator<Prisma.UserSelect>()({
      ...userSelectDefault,
      ...select,
    }),
  });
  return user;
}
