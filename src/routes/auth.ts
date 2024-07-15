import {
  read,
  signInWithGoogle,
  signInWithGoogleCallBack,
} from "@/controllers/signin";
import { signOut } from "@/controllers/signout";
import validateResource from "@/middleware/validateResource";
import { signinSchema } from "@/schemas/auth";
import express, { type Router } from "express";

const router: Router = express.Router();

function authRouter(): Router {
  router.get("/auth/google", signInWithGoogle);
  router.get("/auth/google/callback", signInWithGoogleCallBack);

  router.post("/auth/signin", validateResource(signinSchema), read);
  router.delete("/auth/signout", signOut);

  return router;
}

export default authRouter();
