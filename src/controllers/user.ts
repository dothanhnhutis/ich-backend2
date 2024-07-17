import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { BadRequestError } from "@/error-handler";
import { CreateUserReq, EditUserReq, SearchUserReq } from "@/schemas/user";
import {
  createUserWithPassword,
  getUserByEmail,
  getUserById,
  queueUser,
  updateUserById,
} from "@/services/user";

export async function searchUser(
  req: Request<{}, {}, SearchUserReq["body"], SearchUserReq["query"]>,
  res: Response
) {
  const { page, limit, orderBy, ...props } =
    Object.keys(req.body).length > 0 ? req.body : req.query;

  const user = await queueUser({
    where: props,
    page,
    limit,
    orderBy,
  });

  return res.status(StatusCodes.OK).json(user);
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

export async function getOneUser(req: Request<{ id: string }>, res: Response) {
  const user = await getUserById(req.params.id);
  res.status(StatusCodes.OK).json(user);
}

export async function editUserById(
  req: Request<EditUserReq["params"], {}, EditUserReq["body"]>,
  res: Response
) {
  const { userId } = req.params;
  const data = req.body;
  const userExist = await getUserById(userId);
  if (!userExist) throw new BadRequestError("Invalid user id");
  await updateUserById(userId, data);
  res.status(StatusCodes.OK).json({
    message: "Update user success",
  });
}
