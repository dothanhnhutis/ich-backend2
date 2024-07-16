import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "@/error-handler";
import { getUserByToken, updateUserById } from "@/services/user";

export async function verifyEmail(
  req: Request<{ token: string }>,
  res: Response
) {
  const { token } = req.params;
  const user = await getUserByToken("emailVerification", token);
  if (!user) throw new NotFoundError();

  await updateUserById(user.id, {
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: new Date(),
  });

  return res.status(StatusCodes.OK).json({
    message: "verify email success",
  });
}
