import prisma from "@/utils/db";
import { LinkProvider, Prisma } from "@prisma/client";

// CREATE
export async function createGoogleLink(
  providerId: string,
  userId: string,
  select?: Prisma.LinkProviderSelect
) {
  return await await prisma.linkProvider.create({
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
      ...select,
    }),
  });
}

// UPDATE

// DELETE
