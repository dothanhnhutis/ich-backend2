import crypto from "crypto";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { RecoverAccountReq } from "@/schemas/auth";
import { getUserByEmail, updateUserById } from "@/services/user";
import { BadRequestError } from "@/error-handler";
import { signJWT } from "@/utils/jwt";
import configs from "@/configs";

export async function recoverAccount(
  req: Request<{}, {}, RecoverAccountReq["body"]>,
  res: Response
) {
  const { email } = req.body;
  const existingUser = await getUserByEmail(email);
  if (!existingUser) throw new BadRequestError("Invalid email");
  if (!existingUser.emailVerified)
    throw new BadRequestError(
      "Please verify your email address after using password recovery"
    );

  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  let randomCharacters = existingUser.passwordResetToken;
  let date = existingUser.passwordResetExpires;

  if (!randomCharacters || !date || date.getTime() < Date.now()) {
    randomCharacters = randomBytes.toString("hex");
    date = new Date(Date.now() + 4 * 60 * 60000);
    await updateUserById(existingUser.id, {
      passwordResetToken: randomCharacters,
      passwordResetExpires: date,
    });
  }
  const token = signJWT(
    {
      session: randomCharacters,
      iat: Math.floor(date.getTime() / 1000),
    },
    configs.JWT_SECRET
  );
  const recoverLink = `${configs.CLIENT_URL}/auth/reset-password?token=${token}`;
  // await sendMail({
  //   template: emaiEnum.RECOVER_ACCOUNT,
  //   receiver: email,
  //   locals: {
  //     username: existingUser.username,
  //     recoverLink,
  //   },
  // });

  return res.status(StatusCodes.OK).send({
    message: "Send email success",
  });
}
