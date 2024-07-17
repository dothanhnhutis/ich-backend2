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
import {
  createNewUser,
  editUserById,
  getOneUser,
  searchUser,
} from "@/controllers/user";
import {
  creatUserSchema,
  editUserSchema,
  searchUserSchema,
} from "@/schemas/user";

const router: Router = express.Router();
function userRouter(): Router {
  // User
  router.get("/users/me", authMiddleware(["inActive", "suspended"]), read);
  // User
  router.get(
    "/users/resend-email",
    authMiddleware(["inActive", "suspended"]),
    rateLimitSendEmail,
    resendEmail
  );
  // Admin
  router.get(
    "/users/_search",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN"]),
    validateResource(searchUserSchema),
    searchUser
  );
  // Admin
  router.get(
    "/users/:id",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN"]),
    getOneUser
  );
  //User
  router.post(
    "/users/change-password",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    validateResource(changePasswordSchema),
    changePassword
  );
  //User
  router.post(
    "/users/picture",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    validateResource(changeAvatarSchema),
    changeAvatar
  );
  //Admin
  router.post(
    "/users",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN"]),
    validateResource(creatUserSchema),
    createNewUser
  );
  // User
  router.patch(
    "/users/deactivate",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    deactivate
  );
  // User
  router.patch(
    "/users/change-email",
    authMiddleware(["inActive", "suspended"]),
    changeEmail
  );
  //Admin
  router.patch(
    "/users/:id",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN"]),
    validateResource(editUserSchema),
    editUserById
  );
  // User
  router.patch(
    "/users",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    validateResource(editProfileSchema),
    editProfile
  );

  // router.get("/users/recover/:token", getUserRecoverToken);

  return router;
}

export default userRouter();
