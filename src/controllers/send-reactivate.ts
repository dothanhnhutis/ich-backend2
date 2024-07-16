import configs from "@/configs";
import { NotFoundError } from "@/error-handler";
import { getUserByToken } from "@/services/user";
import { signJWT } from "@/utils/jwt";
import { parse } from "cookie";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const RECOVER_SESSION_NAME = "eid";

export async function sendReactivateAccount(req: Request, res: Response) {
  //   const cookies = parse(req.get("cookie") || "");
  //   if (!cookies[RECOVER_SESSION_NAME]) throw new NotFoundError();
  //   const existingUser = await getUserByToken(
  //     "reActivate",
  //     cookies[RECOVER_SESSION_NAME]
  //   );
  //   if (!existingUser) throw new NotFoundError();
  //   const reactivateLink = `${configs.CLIENT_URL}/auth/reactivate?token=${cookies[RECOVER_SESSION_NAME]}`;
  // await sendMail({
  //   template: emaiEnum.REACTIVATE_ACCOUNT,
  //   receiver: existingUser.email,
  //   locals: {
  //     username: existingUser.username,
  //     reactivateLink,
  //   },
  // });
  //   return res.clearCookie(RECOVER_SESSION_NAME).status(StatusCodes.OK).send({
  //     message: "Send email success",
  //   });
}
