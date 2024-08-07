import crypto from "crypto";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError } from "@/error-handler";
import { emaiEnum, sendMail } from "@/utils/nodemailer";
import { getUserByEmail, getUserById, editUserById } from "@/services/user";
import configs from "@/configs";
import { signJWT } from "@/utils/jwt";
import {
  ChangeAvatarReq,
  ChangePasswordReq,
  editProfileReq,
  CreatePasswordReq,
} from "@/schemas/current-user";
import { compareData } from "@/utils/helper";
import { uploadImageCloudinary } from "@/utils/image";
import { deteleSession } from "@/redis/cache";

export function currentUser(req: Request, res: Response) {
  res.status(StatusCodes.OK).json(req.user);
}

export async function resendEmail(req: Request, res: Response) {
  const { id } = req.user!;
  const user = await getUserById(id);
  if (!user) throw new NotFoundError();
  if (user.emailVerified) throw new NotFoundError();

  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  let randomCharacters = user.emailVerificationToken;
  let date = user.emailVerificationExpires;

  if (!randomCharacters || !date || date.getTime() < Date.now()) {
    randomCharacters = randomBytes.toString("hex");
    date = new Date(Date.now() + 24 * 60 * 60000);
    await editUserById(id, {
      emailVerificationToken: randomCharacters,
      emailVerificationExpires: date,
    });
  }

  const token = signJWT(
    {
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );
  const verificationLink = `${configs.CLIENT_URL}/auth/confirm-email?token=${token}`;

  //   await sendMail({
  //     template: emaiEnum.VERIFY_EMAIL,
  //     receiver: user.email,
  //     locals: {
  //       username: user.username,
  //       verificationLink,
  //     },
  //   });

  return res.status(StatusCodes.OK).json({
    message:
      "New verification email is successfully sent. Please, check your email...",
  });
}

export async function changePassword(
  req: Request<{}, {}, ChangePasswordReq["body"]>,
  res: Response
) {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user!;
  const userExist = await getUserById(id, {
    password: true,
  });
  if (!userExist) throw new BadRequestError("User not exist");
  const isValidOldPassword = await compareData(
    userExist.password!,
    oldPassword
  );

  if (!isValidOldPassword)
    throw new BadRequestError("Old password is incorrect");

  if (oldPassword != newPassword)
    await editUserById(id, {
      password: newPassword,
    });

  return res.status(StatusCodes.OK).json({
    message: "Update password success",
  });
}

export async function createPassword(
  req: Request<{}, {}, CreatePasswordReq["body"]>,
  res: Response
) {
  const { id, hasPassword } = req.user!;
  const { newPassword } = req.body;
  if (hasPassword) throw new BadRequestError("Password has been initialized");

  await editUserById(id, {
    password: newPassword,
  });

  return res.status(StatusCodes.OK).json({
    message: "Create password success",
  });
}

export async function changeAvatar(
  req: Request<{}, {}, ChangeAvatarReq["body"]>,
  res: Response
) {
  const { id } = req.user!;
  const { type, data } = req.body;
  let url: string;

  if (type == "base64") {
    const { secure_url } = await uploadImageCloudinary(data, {
      transformation: [{ width: 640, height: 640, crop: "scale" }],
      tags: ["avatar", id],
    });
    url = secure_url;
  } else {
    url = data;
  }
  await editUserById(id, {
    picture: url,
  });
  return res.send({
    message: "Update picture success",
  });
}

export async function disactivate(req: Request, res: Response) {
  const { id } = req.user!;
  await editUserById(id, {
    disabled: true,
  });
  if (req.sessionID) await deteleSession(req.sessionID);
  res.status(StatusCodes.OK).clearCookie(configs.SESSION_KEY_NAME).json({
    message: "Your account has been disabled. You can reactivate at any time!",
  });
}

export async function editProfile(
  req: Request<{}, {}, editProfileReq["body"]>,
  res: Response
) {
  const { id } = req.user!;
  await editUserById(id, req.body);
  return res.status(StatusCodes.OK).json({ message: "Update profile success" });
}

export async function changeEmail(req: Request, res: Response) {
  const { email } = req.body;
  const { id } = req.user!;

  const user = await getUserById(id);
  if (!user) throw new NotFoundError();

  if (email == user.email)
    throw new BadRequestError(
      "The new password must not be the same as the old password"
    );

  const checkNewEmail = await getUserByEmail(email);
  if (!checkNewEmail) throw new BadRequestError("Email already exists");

  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters = randomBytes.toString("hex");
  const date = new Date(Date.now() + 24 * 60 * 60000);

  await editUserById(id, {
    email,
    emailVerified: false,
    emailVerificationExpires: date,
    emailVerificationToken: randomCharacters,
  });

  const token = signJWT(
    {
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );
  const verificationLink = `${configs.CLIENT_URL}/confirm-email?token=${token}`;

  await sendMail({
    template: emaiEnum.VERIFY_EMAIL,
    receiver: email,
    locals: {
      username: user.username,
      verificationLink: verificationLink,
    },
  });

  return res.status(StatusCodes.OK).json({
    message: "Updated and resending e-mail...",
  });
}
