import express, { type Router } from "express";
import { authMiddleware } from "@/middleware/requiredAuth";
import { rateLimitSendEmail, rateLimitUserId } from "@/middleware/rateLimit";
import validateResource from "@/middleware/validateResource";
import {
  changeAvatar,
  changeEmail,
  changePassword,
  disactivate,
  editProfile,
  currentUser,
  resendEmail,
  createPassword,
  setupMFA,
  disableMFAAccount,
  enableMFAAccount,
  connectOauthProvider,
  connectOauthProviderCallback,
  disconnectOauthProvider,
  readAllSession,
  removeSession,
} from "@/controllers/current-user";
import {
  changeAvatarSchema,
  changePasswordSchema,
  editProfileSchema,
  createPasswordSchema,
  enableMFASchema,
  setupMFASchema,
} from "@/schemas/current-user";
import {
  createNewUser,
  updateUserById,
  readUser,
  searchUser,
} from "@/controllers/user";
import {
  creatUserSchema,
  disconnectOauthProviderSchema,
  editUserSchema,
  searchUserSchema,
} from "@/schemas/user";
import checkPermission from "@/middleware/checkPermission";

const router: Router = express.Router();
function userRouter(): Router {
  // User
  router.get(
    "/users/me",
    authMiddleware(["disabled", "suspended"]),
    currentUser
  );
  // User
  router.get(
    "/users/resend-email",
    authMiddleware(["disabled", "suspended"]),
    rateLimitSendEmail,
    resendEmail
  );
  // Admin
  router.get(
    "/users/_search",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin"]),
    validateResource(searchUserSchema),
    searchUser
  );
  // User
  router.get(
    "/users/sessions",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    readAllSession
  );
  // User
  router.get(
    "/users/connect/:provider",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    connectOauthProvider
  );
  // User
  router.get(
    "/users/connect/:provider/callback",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    connectOauthProviderCallback
  );
  // Admin
  router.get(
    "/users/:id",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin"]),
    readUser
  );
  //User
  router.post(
    "/users/change-password",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    validateResource(changePasswordSchema),
    changePassword
  );
  router.post(
    "/users/password",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    validateResource(createPasswordSchema),
    createPassword
  );
  //User
  router.post(
    "/users/picture",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    validateResource(changeAvatarSchema),
    changeAvatar
  );
  //Admin
  router.post(
    "/users",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin"]),
    validateResource(creatUserSchema),
    createNewUser
  );
  // User
  router.patch(
    "/users/disactivate",
    authMiddleware(["disabled", "suspended"]),
    disactivate
  );
  // User
  router.patch(
    "/users/change-email",
    authMiddleware(["disabled", "suspended"]),
    changeEmail
  );
  //Admin
  router.patch(
    "/users/:userId",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin"]),
    validateResource(editUserSchema),
    updateUserById
  );
  // User
  router.patch(
    "/users",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    validateResource(editProfileSchema),
    editProfile
  );
  // User
  router.post(
    "/users/mfa/setup",
    // rateLimitUserId,
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    validateResource(setupMFASchema),
    setupMFA
  );
  // User
  router.post(
    "/users/mfa/enable",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    validateResource(enableMFASchema),
    enableMFAAccount
  );
  // User
  router.post(
    "/users/mfa/disable",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    disableMFAAccount
  );
  // User
  router.post(
    "/users/disconnect",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    validateResource(disconnectOauthProviderSchema),
    disconnectOauthProvider
  );

  // User
  router.delete(
    "/users/sessions/:sessionId",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    removeSession
  );

  return router;
}

export default userRouter();
