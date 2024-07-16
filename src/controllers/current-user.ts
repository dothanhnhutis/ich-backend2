import crypto from "crypto";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "@/error-handler";
import { emaiEnum } from "@/utils/nodemailer";
import { getUserById, updateUserById } from "@/services/user";
import configs from "@/configs";
import { signJWT } from "@/utils/jwt";

export function read(req: Request, res: Response) {
  res.status(StatusCodes.OK).json(req.user);
}

export async function resendEmail(req: Request, res: Response) {
  const { id } = req.session.user!;
  const user = await getUserById(id);

  if (!user) throw new NotFoundError();
  // let verificationLink = `${configs.CLIENT_URL}/auth/confirm-email?token=${user.emailVerificationToken}`;
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  let randomCharacters = user.emailVerificationToken;
  let date = user.emailVerificationExpires;

  if (!randomCharacters || !date || date.getTime() < Date.now()) {
    randomCharacters = randomBytes.toString("hex");
    date = new Date(Date.now() + 24 * 60 * 60000);
    await updateUserById(id, {
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
