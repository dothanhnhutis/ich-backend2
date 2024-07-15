import { RequestHandler as Middleware } from "express";
import { PermissionError } from "../error-handler";
import { UserRole } from "@/schemas/auth.schema";
import prisma from "@/utils/db";

const checkPermission =
  (roles: UserRole[]): Middleware =>
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
