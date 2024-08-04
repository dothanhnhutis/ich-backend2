import prisma from "@/utils/db";
import { Prisma } from "@prisma/client";

const linkSelectDefault: Prisma.LinkProviderSelect = {
  id: true,
  user: {
    select: {
      id: true,
      suspended: true,
      inActive: true,
    },
  },
};
// CREATE
export async function insertGoogleLink(
  providerId: string,
  userId: string,
  select?: Prisma.LinkProviderSelect
) {
  return await prisma.linkProvider.create({
    data: {
      provider: "google",
      providerId,
      user: {
        connect: {
          id: userId,
        },
      },
    },
    select: Prisma.validator<Prisma.LinkProviderSelect>()({
      ...linkSelectDefault,
      ...select,
    }),
  });
}
// READ
export async function getGoogleProviderById(
  providerId: string,
  select?: Prisma.LinkProviderSelect
) {
  return await prisma.linkProvider.findUnique({
    where: {
      provider_providerId: {
        provider: "google",
        providerId,
      },
    },
    select: Prisma.validator<Prisma.LinkProviderSelect>()({
      ...linkSelectDefault,
      ...select,
    }),
  });
}

// UPDATE

// DELETE
