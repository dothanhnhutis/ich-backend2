import {
  getSession,
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
  recoverAccountSchema,
  resetPasswordSchema,
  sendReActivateAccountSchema,
  signinSchema,
  signupSchema,
} from "@/schemas/auth";
import express, { type Router } from "express";

const router: Router = express.Router();

function authRouter(): Router {
  router.get("/auth/google", signInWithGoogle);
  router.get("/auth/google/callback", signInWithGoogleCallBack);

  router.post("/auth/signin", validateResource(signinSchema), signIn);
  router.delete("/auth/signout", signOut);

  router.post("/auth/signup", validateResource(signupSchema), signUp);
  router.get("/auth/confirm-email/:session", verifyEmail);

  router.get("/auth", getSession);

  router.patch(
    "/auth/recover",
    rateLimitRecover,
    validateResource(recoverAccountSchema),
    recoverAccount
  );
  router.patch(
    "/auth/reset-password",
    validateResource(resetPasswordSchema),
    resetPassword
  );

  router.post(
    "/auth/reactivate",
    validateResource(sendReActivateAccountSchema),
    sendReactivateAccount
  );
  router.get("/auth/reactivate/:session", reActivateAccount);

  return router;
}

export default authRouter();
