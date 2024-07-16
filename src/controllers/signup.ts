import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "@/error-handler";
import { SignUpReq } from "@/schemas/auth";
import { createUserWithPassword, getUserByEmail } from "@/services/user";

export async function create(
  req: Request<{}, {}, SignUpReq["body"]>,
  res: Response
) {
  const { email } = req.body;
  const user = await getUserByEmail(email);
  if (user) throw new BadRequestError("User already exists");

  await createUserWithPassword(req.body);

  return res.status(StatusCodes.CREATED).send({
    message:
      "Sign up success. A confirmation email will be sent to your email address.",
  });
}
