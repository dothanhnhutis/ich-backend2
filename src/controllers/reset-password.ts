import { BadRequestError } from "@/error-handler";
import { ResetPasswordReq } from "@/schemas/auth";
import { getUserByToken, updateUserById } from "@/services/user";
import crypto from "crypto";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function resetPassword(
  req: Request<ResetPasswordReq["params"], {}, ResetPasswordReq["body"]>,
  res: Response
) {
  const { token } = req.params;
  const { password } = req.body;

  const existingUser = await getUserByToken("recoverAccount", token);
  if (!existingUser) throw new BadRequestError("Reset token has expired");
  await updateUserById(existingUser.id, {
    password,
  });

  return res.status(StatusCodes.OK).send({
    message: "Reset password success",
  });
}
