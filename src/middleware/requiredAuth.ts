import { Request, RequestHandler as Middleware } from "express";
import { NotAuthorizedError, PermissionError } from "../error-handler";
import prisma from "@/utils/db";
import { getUserById } from "@/services/user";

type AuthMiddlewareCheckType = "emailVerified" | "suspended" | "inActive";

export const authMiddleware =
  (typesCheck?: AuthMiddlewareCheckType[]): Middleware =>
  async (req, _, next) => {
    if (!req.session.user) {
      throw new NotAuthorizedError();
    }

    if (typesCheck) {
      const user = await getUserById(req.session.user.id);
      if (!user) {
        await req.logout();
        throw new NotAuthorizedError();
      }
      if (typesCheck.includes("emailVerified") && !user.emailVerified) {
        throw new PermissionError("Your email hasn't been verified");
      }
      if (typesCheck.includes("inActive") && user.inActive) {
        throw new PermissionError();
      }
      if (typesCheck.includes("suspended") && user.suspended) {
        throw new PermissionError(
          "Your account has been locked please contact the administrator"
        );
      }
      req.user = user;
    }
    next();
  };
