import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function signOut(req: Request, res: Response) {
  await req.logout();
  res
    .status(StatusCodes.OK)
    .json({
      message: "Sign out successful",
    })
    .end();
}
