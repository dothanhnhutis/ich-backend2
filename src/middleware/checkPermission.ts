import prisma from "@/utils/db";
import { RequestHandler as Middleware } from "express";
import { PermissionError } from "../error-handler";
import { Role } from "@/schemas/user";

const checkPermission =
  (roles: Role[]): Middleware =>
  async (req, res, next) => {
    const user = await prisma.user.findUnique({
      where: {
        id: req.session.user?.id,
      },
    });
    if (!user || !roles.includes(user.role)) throw new PermissionError();
    next();
  };
export default checkPermission;
