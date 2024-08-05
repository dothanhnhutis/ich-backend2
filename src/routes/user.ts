import express, { type Router } from "express";
import { authMiddleware } from "@/middleware/requiredAuth";
import { rateLimitSendEmail } from "@/middleware/rateLimit";
import validateResource from "@/middleware/validateResource";
import {
  changeAvatar,
  changeEmail,
  changePassword,
  deactivate,
  editProfile,
  currentUser,
  resendEmail,
} from "@/controllers/current-user";
import {
  changeAvatarSchema,
  changePasswordSchema,
  editProfileSchema,
} from "@/schemas/current-user";
import {
  createNewUser,
  updateUserById,
  readUser,
  searchUser,
} from "@/controllers/user";
import {
  creatUserSchema,
  editUserSchema,
  searchUserSchema,
} from "@/schemas/user";
import checkPermission from "@/middleware/checkPermission";

const router: Router = express.Router();
function userRouter(): Router {
  // User
  router.get(
    "/users/me",
    authMiddleware(["inActive", "suspended"]),
    currentUser
  );
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
    readUser
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
    updateUserById
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
