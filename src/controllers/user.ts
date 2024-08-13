import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { BadRequestError, NotFoundError } from "@/error-handler";
import { CreateUserReq, EditUserReq, SearchUserReq } from "@/schemas/user";
import {
  insertUserWithPassword,
  getUserByEmail,
  getUserById,
  queueUser,
  editUserById,
} from "@/services/user";

export async function searchUser(
  req: Request<{}, {}, SearchUserReq["body"], SearchUserReq["query"]>,
  res: Response
) {
  const { page, limit, order_by, ...where } = req.body || req.query || {};
  const { users, metadata } = await queueUser({
    where,
    page,
    limit,
    order_by,
    select: {
      password: true,
      linkProviders: true,
      emailVerified: true,
      status: true,
    },
  });
  return res.status(StatusCodes.OK).json({
    users,
    metadata,
  });
}

export async function createNewUser(
  req: Request<{}, {}, CreateUserReq["body"]>,
  res: Response
) {
  const { email } = req.body;
  const user = await getUserByEmail(email);
  if (user) throw new BadRequestError("Email has been used");
  await insertUserWithPassword(req.body);
  return res.status(StatusCodes.OK).json({
    message: "create new user success",
  });
}

export async function readUser(req: Request<{ id: string }>, res: Response) {
  const user = await getUserById(req.params.id, {
    emailVerified: true,
    status: true,
  });
  if (!user) throw new NotFoundError();
  res.status(StatusCodes.OK).json(user);
}

export async function updateUserById(
  req: Request<EditUserReq["params"], {}, EditUserReq["body"]>,
  res: Response
) {
  const { userId } = req.params;
  const data = req.body;
  const userExist = await getUserById(userId, {
    emailVerified: true,
    status: true,
  });
  if (!userExist) throw new BadRequestError("Invalid user id");
  await editUserById(userId, data);
  res.status(StatusCodes.OK).json({
    message: "Update user success",
  });
}
