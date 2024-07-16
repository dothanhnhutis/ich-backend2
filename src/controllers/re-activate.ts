import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "@/error-handler";
import { getUserByToken, updateUserById } from "@/services/user";

export async function reActivateAccount(
  req: Request<{ token: string }>,
  res: Response
) {
  const { token } = req.params;
  const user = await await getUserByToken("reActivate", token);

  if (!user) throw new NotFoundError();
  await updateUserById(user.id, {
    inActive: true,
    reActiveExpires: new Date(),
    reActiveToken: null,
  });

  return res.status(StatusCodes.OK).send({
    message: "reactivateAccount",
  });
}
