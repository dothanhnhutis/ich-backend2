import { RequestHandler as Middleware } from "express";
import { NotAuthorizedError, PermissionError } from "../error-handler";

type AuthMiddlewareCheckType = "emailVerified" | "suspended" | "disabled";

export const authMiddleware =
  (typesCheck?: AuthMiddlewareCheckType[]): Middleware =>
  async (req, _, next) => {
    if (!req.user) {
      throw new NotAuthorizedError();
    }

    if (typesCheck) {
      if (typesCheck.includes("emailVerified") && !req.user.emailVerified) {
        throw new PermissionError("Your email hasn't been verified");
      }
      if (typesCheck.includes("suspended") && req.user.status == "Suspended") {
        throw new PermissionError("Your account has been suspended.");
      }
      if (typesCheck.includes("disabled") && req.user.status == "Disabled") {
        throw new PermissionError(
          "Your account has been disabled. Please contact your administrator to restore your account"
        );
      }
    }
    return next();
  };
