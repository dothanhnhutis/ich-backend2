import { RequestHandler as Middleware } from "express";
import { NotAuthorizedError, PermissionError } from "../error-handler";
import { getUserById } from "@/services/user";
import configs from "@/configs";
import { deteleSession } from "@/redis/cache";

type AuthMiddlewareCheckType = "emailVerified" | "suspended" | "inActive";

export const authMiddleware =
  (typesCheck?: AuthMiddlewareCheckType[]): Middleware =>
  async (req, res, next) => {
    if (!req.user) {
      throw new NotAuthorizedError();
    }
    if (typesCheck) {
      if (typesCheck.includes("emailVerified") && !req.user.emailVerified) {
        throw new PermissionError("Your email hasn't been verified");
      }
      if (typesCheck.includes("inActive") && req.user.inActive) {
        throw new PermissionError();
      }
      if (typesCheck.includes("suspended") && req.user.suspended) {
        throw new PermissionError(
          "Your account has been locked please contact the administrator"
        );
      }
    }
    next();
  };
