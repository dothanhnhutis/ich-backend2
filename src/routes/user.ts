import express, { type Router } from "express";
import { authMiddleware } from "@/middleware/requiredAuth";
import {
  changeAvatar,
  changeEmail,
  changePassword,
  deactivate,
  editProfile,
  read,
  resendEmail,
} from "@/controllers/current-user";
import { rateLimitSendEmail } from "@/middleware/rateLimit";
import {
  changeAvatarSchema,
  changePasswordSchema,
  editProfileSchema,
} from "@/schemas/current-user";
import validateResource from "@/middleware/validateResource";
import checkPermission from "@/middleware/checkPermission";
import { createNewUser, searchUser } from "@/controllers/user";
import { creatUserSchema, searchUserSchema } from "@/schemas/user";

const router: Router = express.Router();
function userRouter(): Router {
  //Current User
  router.get("/users", authMiddleware(["inActive", "suspended"]), read);

  router.get(
    "/users/resend-email",
    authMiddleware(["inActive", "suspended"]),
    rateLimitSendEmail,
    resendEmail
  );

  router.post(
    "/users/change-password",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    validateResource(changePasswordSchema),
    changePassword
  );

  router.post(
    "/users/picture",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    validateResource(changeAvatarSchema),
    changeAvatar
  );

  router.patch(
    "/users/deactivate",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    deactivate
  );

  router.patch(
    "/users",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    validateResource(editProfileSchema),
    editProfile
  );

  router.patch(
    "/users/change-email",
    authMiddleware(["inActive", "suspended"]),
    changeEmail
  );

  // User Admin

  router.get(
    "/users/_search",
    // authMiddleware(["emailVerified", "inActive", "suspended"]),
    // checkPermission(["ADMIN"]),
    validateResource(searchUserSchema),
    searchUser
  );

  router.post(
    "/users",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN"]),
    validateResource(creatUserSchema),
    createNewUser
  );

  router.get(
    "/users/:id",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN"]),
    read
  );

  return router;
}

export default userRouter();
