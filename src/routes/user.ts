import express, { type Router } from "express";
import { authMiddleware } from "@/middleware/requiredAuth";
import { read, resendEmail } from "@/controllers/current-user";
import { rateLimitSendEmail } from "@/middleware/rateLimit";

const router: Router = express.Router();
function userRouter(): Router {
  router.get("/users", authMiddleware(["inActive", "suspended"]), read);
  router.get(
    "/users/resend-email",
    authMiddleware(["inActive", "suspended"]),
    rateLimitSendEmail,
    resendEmail
  );
  router.post(
    "/users/password",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    validateResource(editPasswordSchema),
    editPassword
  );
  return router;
}

export default userRouter();
