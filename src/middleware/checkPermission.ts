import { RequestHandler as Middleware } from "express";
import { PermissionError } from "../error-handler";
import { Role } from "@/schemas/user";

const checkPermission =
  (roles: Role[]): Middleware =>
  async (req, _, next) => {
    if (!req.user || !roles.includes(req.user.role))
      throw new PermissionError();
    return next();
  };
export default checkPermission;
