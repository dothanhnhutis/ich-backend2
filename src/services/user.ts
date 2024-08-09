import configs from "@/configs";
import { BadRequestError } from "@/error-handler";
import { CreateUserReq, Role } from "@/schemas/user";
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
// Read
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
          emailVerificationToken: data.session,
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
          passwordResetToken: data.session,
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
          reActiveToken: data.session,
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
  username?: string | undefined;
  role?: Role[] | undefined;
  emailVerified?: boolean | undefined;
  disabled?: boolean | undefined;
  suspended?: boolean | undefined;
};

type QueryUserOrderByType = {
  email?: "asc" | "desc";
  username?: "asc" | "desc";
  role?: "asc" | "desc";
  emailVerified?: "asc" | "desc";
  disabled?: "asc" | "desc";
  suspended?: "asc" | "desc";
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
    const { id, email, role, username, emailVerified, disabled, suspended } =
      data.where;
    args.where = {
      username: {
        contains: username,
      },
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
      disabled: disabled,
      suspended: suspended,
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
  data: CreateUserReq["body"],
  select?: Prisma.UserSelect
) {
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString("hex");
  const date: Date = new Date(Date.now() + 24 * 60 * 60000);
  const hash = hashData(data.password);

  const user = await prisma.user.create({
    data: {
      role: data.role || "Customer",
      email: data.email,
      password: hash,
      username: data.username,
      emailVerificationToken: randomCharacters,
      emailVerificationExpires: date,
      disabled: data.disabled,
      suspended: data.suspended,
    },
    select: Prisma.validator<Prisma.UserSelect>()({
      ...userSelectDefault,
      ...select,
    }),
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

export async function insertUserWithGoogle(googleData: GoogleUserInfo) {
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

// Update
type UpdateUserByIdData = {
  password?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  disabled?: boolean;
  reActiveExpires?: Date | null;
  reActiveToken?: string | null;
  picture?: string | null;
  username?: string;
  phone?: string | null;
  address?: string | null;
  email?: string;
};

export async function editUserById(
  id: string,
  data: UpdateUserByIdData,
  select?: Prisma.UserSelect
) {
  if (data.password) {
    data.password = hashData(data.password);
  }

  return await prisma.user.update({
    where: {
      id,
    },
    data: data,
    select: Prisma.validator<Prisma.UserSelect>()({
      ...userSelectDefault,
      ...select,
    }),
  });
}
