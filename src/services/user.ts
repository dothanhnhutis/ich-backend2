import configs from "@/configs";
import { CreateUserReq, Role, User, UserStatus } from "@/schemas/user";
import prisma from "@/utils/db";
import { hashData } from "@/utils/helper";
import { signJWT, verifyJWT } from "@/utils/jwt";
import { emaiEnum, sendMail } from "@/utils/nodemailer";
import { GoogleUserInfo } from "@/utils/oauth";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

// Read
export const userSelectDefault: Prisma.UserSelect = {
  id: true,
  email: true,
  role: true,
  emailVerified: true,
  status: true,
  hasPassword: true,
  mFAEnabled: true,
  profile: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photo: true,
      coverPhoto: true,
      phone: true,
      address: true,
      postalCode: true,
      country: true,
      region: true,
      city: true,
      bio: true,
      urls: true,
    },
  },
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
  session: string,
  select?: Prisma.UserSelect
) {
  switch (type) {
    case "emailVerification":
      return await prisma.user.findUnique({
        where: {
          emailVerificationToken: session,
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
          passwordResetToken: session,
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
          reActiveToken: session,
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

type QueryUserWhereType = {
  id?: string[] | undefined;
  email?: string[] | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  role?: Role[] | undefined;
  emailVerified?: boolean | undefined;
  status?: User["status"][] | undefined;
};

type QueryUserOrderByType = {
  email?: "asc" | "desc";
  firstName?: "asc" | "desc";
  lastName?: "asc" | "desc";
  role?: "asc" | "desc";
  emailVerified?: "asc" | "desc";
  status?: "asc" | "desc";
  createdAt?: "asc" | "desc";
  updatedAt?: "asc" | "desc";
};

type QueryUserType = {
  where: QueryUserWhereType;
  limit?: number;
  page?: number;
  order_by?: QueryUserOrderByType[];
  select?: Prisma.UserSelect;
};

export async function queueUser(data?: QueryUserType) {
  const take = data?.limit || 10;
  const page = (!data?.page || data.page <= 0 ? 1 : data.page) - 1;
  const skip = page * take;

  let args: Prisma.UserFindManyArgs = {
    where: {},
    select: Prisma.validator<Prisma.UserSelect>()({
      ...userSelectDefault,
      ...data?.select,
    }),
    take,
    skip,
  };
  if (data?.where) {
    const { id, email, role, firstName, lastName, emailVerified, status } =
      data.where;
    args.where = {
      // firstName: {
      //   contains: firstName,
      // },
      // lastName: {
      //   contains: lastName,
      // },
      id: {
        in: id,
      },
      email: {
        in: email,
      },
      role: {
        in: role,
        notIn: ["Admin"],
      },
      emailVerified: emailVerified,
      status: {
        in: status,
      },
    };
  }

  if (data?.order_by) {
    args.orderBy = data.order_by;
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany(args),
    prisma.user.count({ where: args.where }),
  ]);

  return {
    users,
    metadata: {
      hasNextPage: skip + take < total,
      totalPage: Math.ceil(total / take),
      totalItem: total,
    },
  };
}
// Create
export async function insertUserWithPassword(
  input: CreateUserReq["body"],
  select?: Prisma.UserSelect
) {
  const { password, firstName, lastName, ...props } = input;

  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString("hex");
  const date: Date = new Date(Date.now() + 24 * 60 * 60000);
  const hash = hashData(password);

  const user = await prisma.user.create({
    data: {
      ...props,
      password: hash,
      emailVerificationToken: randomCharacters,
      emailVerificationExpires: date,
      hasPassword: true,
      profile: {
        create: {
          firstName,
          lastName,
        },
      },
    },
    select: Prisma.validator<Prisma.UserSelect>()({
      ...userSelectDefault,
      ...select,
    }),
  });

  const token = signJWT(
    {
      type: "emailVerification",
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );
  const verificationLink = `${configs.CLIENT_URL}/confirm-email?token=${token}`;

  await sendMail({
    template: emaiEnum.VERIFY_EMAIL,
    receiver: props.email,
    locals: {
      username: firstName + " " + lastName,
      verificationLink,
    },
  });
  return user;
}

export async function insertUserWithGoogle(googleData: GoogleUserInfo) {
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString("hex");
  const date: Date = new Date(Date.now() + 24 * 60 * 60000);

  const data: Prisma.UserCreateInput = {
    email: googleData.email,
    emailVerified: googleData.verified_email,
    emailVerificationToken: !googleData.verified_email
      ? randomCharacters
      : null,
    emailVerificationExpires: !googleData.verified_email ? date : null,
    profile: {
      create: {
        firstName: googleData.given_name,
        lastName: googleData.family_name,
        photo: googleData.picture,
      },
    },
  };

  if (data.emailVerificationToken) {
    const token = signJWT(
      {
        type: "emailVerification",
        session: randomCharacters,
        iat: Math.floor(date.getTime() / 1000),
      },
      configs.JWT_SECRET
    );
    const verificationLink = `${configs.CLIENT_URL}/auth/confirm-email?token=${token}`;
    await sendMail({
      template: emaiEnum.VERIFY_EMAIL,
      receiver: data.email,
      locals: {
        username: googleData.given_name + " " + googleData.family_name,
        verificationLink,
      },
    });
  }

  return await prisma.user.create({
    data,
  });
}

// Update
type UpdateUserByIdData = {
  twoFAEnabled?: boolean | undefined;
  password?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  emailVerified?: boolean | undefined;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  status?: UserStatus | undefined;
  reActiveExpires?: Date | null;
  reActiveToken?: string | null;
  picture?: string | null;
  firstName?: string | undefined;
  lastName?: string | undefined;
  phone?: string | null;
  address?: string | null;
  email?: string | undefined;
};

export async function editUserById(
  id: string,
  input: UpdateUserByIdData,
  select?: Prisma.UserSelect
) {
  let data: Prisma.UserUpdateInput = {
    ...input,
  };
  if (input.password) {
    data.password = hashData(input.password);
    data.hasPassword = true;
  }

  return await prisma.user.update({
    where: {
      id,
    },
    data,
    select: Prisma.validator<Prisma.UserSelect>()({
      ...userSelectDefault,
      ...select,
    }),
  });
}

export async function enableMFA(
  id: string,
  input: {
    secretKey: string;
    backupCodes: string[];
  }
) {
  await prisma.mFA.create({
    data: {
      userId: id,
      backupCodes: input.backupCodes,
      secretKey: input.secretKey,
    },
  });

  await prisma.user.update({
    where: {
      id,
    },
    data: {
      mFAEnabled: true,
    },
  });
}
export async function disableMFA(id: string) {
  await prisma.user.update({
    where: {
      id,
    },
    data: {
      mFAEnabled: false,
    },
  });
  await prisma.mFA.delete({
    where: {
      userId: id,
    },
  });
}
