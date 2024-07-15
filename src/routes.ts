import { Application } from "express";
import healthRouter from "@/routes/health";
import authRouter from "@/routes/auth";
// import userRouter from "@/routes/user";

const BASE_PATH = "/api/v1";
export function appRouter(app: Application) {
  app.use("", healthRouter);
  app.use(BASE_PATH, authRouter);
  //   app.use(BASE_PATH, userRouter);
}
