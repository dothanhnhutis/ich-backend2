import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { BadRequestError } from "@/error-handler";
import { CreateUserReq, SearchUserReq } from "@/schemas/user";
import { createUserWithPassword, getUserByEmail } from "@/services/user";

export function searchUser(
  req: Request<{}, {}, SearchUserReq["body"], {}>,
  res: Response
) {
  console.log(req.body);
  console.log(req.query);

  return res.status(StatusCodes.OK).send("searchUser");
}

export async function createNewUser(
  req: Request<{}, {}, CreateUserReq["body"]>,
  res: Response
) {
  const { email } = req.body;
  const user = await getUserByEmail(email);
  if (user) throw new BadRequestError("Email has been used");
  await createUserWithPassword(req.body);
  return res.status(StatusCodes.OK).json({
    message: "create new user success",
  });
}
