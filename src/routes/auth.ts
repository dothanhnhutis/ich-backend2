import {
  checkEmailSignIn,
  reActivateAccount,
  recoverAccount,
  resetPassword,
  sendReactivateAccount,
  signIn,
  signInWithGoogle,
  signInWithGoogleCallBack,
  signOut,
  signUp,
  verifyEmail,
} from "@/controllers/auth";
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
  router.post("/auth/signin", validateResource(signinSchema), signIn);
  router.delete("/auth/signout", signOut);

  router.post("/auth/signup", validateResource(signupSchema), signUp);
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
