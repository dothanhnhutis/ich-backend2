import prisma from "@/utils/db";
import { Prisma } from "@prisma/client";

export const mFASelectDefault: Prisma.MFASelect = {
  id: true,
  backupCodes: true,
  secretKey: true,
  backupCodesUsed: true,
  lastTwoFATime: true,
  createdAt: true,
  updatedAt: true,
};

export async function updateBackupCodeUsedById(
  id: string,
  code: string,
  select?: Prisma.MFASelect
) {
  return await prisma.mFA.update({
    where: { userId: id },
    data: {
      backupCodesUsed: {
        push: code,
      },
    },
    select: Prisma.validator<Prisma.MFASelect>()({
      ...mFASelectDefault,
      ...select,
    }),
  });
}
