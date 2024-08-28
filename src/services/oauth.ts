import prisma from "@/utils/db";
import { Prisma } from "@prisma/client";

const linkSelectDefault: Prisma.OauthProviderSelect = {
  id: true,
  user: {
    select: {
      id: true,
      status: true,
    },
  },
};
// CREATE
export async function insertGoogleLink(
  providerId: string,
  userId: string,
  select?: Prisma.OauthProviderSelect
) {
  return await prisma.oauthProvider.create({
    data: {
      provider: "google",
      providerId,
      user: {
        connect: {
          id: userId,
        },
      },
    },
    select: Prisma.validator<Prisma.OauthProviderSelect>()({
      ...linkSelectDefault,
      ...select,
    }),
  });
}
// READ
export async function getGoogleProviderById(
  providerId: string,
  select?: Prisma.OauthProviderSelect
) {
  return await prisma.oauthProvider.findUnique({
    where: {
      provider_providerId: {
        provider: "google",
        providerId,
      },
    },
    select: Prisma.validator<Prisma.OauthProviderSelect>()({
      ...linkSelectDefault,
      ...select,
    }),
  });
}

// UPDATE

// DELETE
