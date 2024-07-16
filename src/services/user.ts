import configs from "@/configs";
import prisma from "@/utils/db";
import { hashData } from "@/utils/helper";
import { signJWT, verifyJWT } from "@/utils/jwt";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

export type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
};

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

export async function getUserById(id: string, select?: Prisma.UserSelect) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: Prisma.validator<Prisma.UserSelect>()({
      ...userSelectDefault,
      ...select,
    }),
  });
  return user;
}

export async function getUserByToken(
  type: "emailVerification" | "recoverAccount" | "reActivate",
  token: string,
  select?: Prisma.UserSelect
) {
  const data = verifyJWT<{ session: string }>(token, configs.JWT_SECRET);
  if (!data) return null;
  switch (type) {
    case "emailVerification":
      return await prisma.user.findUnique({
        where: {
          emailVerificationToken: token,
          emailVerificationExpires: { gte: new Date() },
        },
        select: Prisma.validator<Prisma.UserSelect>()({
          ...userSelectDefault,
          ...select,
        }),
      });
    case "recoverAccount":
      return await prisma.user.findUnique({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { gte: new Date() },
        },
        select: Prisma.validator<Prisma.UserSelect>()({
          ...userSelectDefault,
          ...select,
        }),
      });
    case "reActivate":
      return await prisma.user.findUnique({
        where: {
          reActiveToken: token,
          reActiveExpires: { gte: new Date() },
        },
        select: Prisma.validator<Prisma.UserSelect>()({
          ...userSelectDefault,
          ...select,
        }),
      });
    default:
      return null;
  }
}

export async function createUserWithPassword(data: {
  email: string;
  password: string;
  username: string;
}) {
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString("hex");
  const date: Date = new Date(Date.now() + 24 * 60 * 60000);
  const hash = hashData(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hash,
      username: data.username,
      emailVerificationToken: randomCharacters,
      emailVerificationExpires: date,
    },
  });
  const token = signJWT(
    {
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );
  const verificationLink = `${configs.CLIENT_URL}/auth/confirm-email?token=${token}`;

  // await sendMail({
  //   template: emaiEnum.VERIFY_EMAIL,
  //   receiver: email,
  //   locals: {
  //     username,
  //     verificationLink,
  //   },
  // });
  return user;
}

export async function createUserWithGoogle(googleData: GoogleUserInfo) {
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString("hex");
  const date: Date = new Date(Date.now() + 24 * 60 * 60000);

  const data: Prisma.UserCreateInput = {
    email: googleData.email,
    emailVerified: googleData.verified_email,
    username: googleData.name,
    picture: googleData.picture,
    emailVerificationToken: !googleData.verified_email
      ? randomCharacters
      : null,
    emailVerificationExpires: !googleData.verified_email ? date : null,
  };

  if (data.emailVerificationToken) {
    const token = signJWT(
      {
        session: randomCharacters,
        iat: Math.floor(date.getTime() / 1000),
      },
      configs.JWT_SECRET
    );
    const verificationLink = `${configs.CLIENT_URL}/auth/confirm-email?token=${token}`;
    // await sendMail({
    //   template: emaiEnum.VERIFY_EMAIL,
    //   receiver: data.email,
    //   locals: {
    //     username: data.username,
    //     verificationLink,
    //   },
    // });
  }

  return await prisma.user.create({
    data,
  });
}

type UpdateUserByIdData = {
  password?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  inActive?: boolean;
  reActiveExpires?: Date | null;
  reActiveToken?: string | null;
};

export async function updateUserById(
  userId: string,
  data: UpdateUserByIdData,
  select?: Prisma.UserSelect
) {
  if (data.password) {
    data.password = hashData(data.password);
  }
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: data,
    select: Prisma.validator<Prisma.UserSelect>()({
      ...userSelectDefault,
      ...select,
    }),
  });
}
