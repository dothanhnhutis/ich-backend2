import { reActivateAccount } from "@/controllers/re-activate";
import { recoverAccount } from "@/controllers/recover-account";
import { resetPassword } from "@/controllers/reset-password";
import { sendReactivateAccount } from "@/controllers/send-reactivate";
import {
  checkEmailSignIn,
  read,
  signInWithGoogle,
  signInWithGoogleCallBack,
} from "@/controllers/signin";
import { signOut } from "@/controllers/signout";
import { create } from "@/controllers/signup";
import { verifyEmail } from "@/controllers/verify-email";
import { rateLimitRecover } from "@/middleware/rateLimit";
import validateResource from "@/middleware/validateResource";
import {
  checkEmailSignInSchema,
  recoverAccountSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
} from "@/schemas/auth";
import express, { type Router } from "express";

const router: Router = express.Router();

function authRouter(): Router {
  router.get("/auth/google", signInWithGoogle);
  router.get("/auth/google/callback", signInWithGoogleCallBack);

  router.post(
    "/auth/account/email",
    validateResource(checkEmailSignInSchema),
    checkEmailSignIn
  ); // re-check
  router.post("/auth/signin", validateResource(signinSchema), read);
  router.delete("/auth/signout", signOut);

  router.post("/auth/signup", validateResource(signupSchema), create);
  router.get("/auth/confirm-email/:token", verifyEmail);

  router.patch(
    "/auth/recover",
    rateLimitRecover,
    validateResource(recoverAccountSchema),
    recoverAccount
  );
  router.patch(
    "/auth/reset-password/:token",
    validateResource(resetPasswordSchema),
    resetPassword
  );

  router.get("/auth/reactivate/send", sendReactivateAccount); // re-check
  router.get("/auth/reactivate/:token", reActivateAccount); // re-check

  return router;
}

export default authRouter();
