import prisma from "@/utils/db";
import { Prisma } from "@prisma/client";

const oauthSelectDefault: Prisma.OauthProviderSelect = {
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
      ...oauthSelectDefault,
      ...select,
    }),
  });
}
// READ
export async function getProvider(
  providerId: string,
  provider: string,
  select?: Prisma.OauthProviderSelect
) {
  return await prisma.oauthProvider.findUnique({
    where: {
      provider_providerId: {
        provider,
        providerId,
      },
    },
    select: Prisma.validator<Prisma.OauthProviderSelect>()({
      ...oauthSelectDefault,
      ...select,
    }),
  });
}
// DELETE
export async function deleteOauth(
  providerId: string,
  provider: string,
  select?: Prisma.OauthProviderSelect
) {
  return await prisma.oauthProvider.delete({
    where: {
      provider_providerId: {
        provider,
        providerId,
      },
    },
    select: Prisma.validator<Prisma.OauthProviderSelect>()({
      ...oauthSelectDefault,
      ...select,
    }),
  });
}
