import { Application } from "express";
import healthRouter from "@/routes/health";
import authRouter from "@/routes/auth";
import userRouter from "@/routes/user";
import tagRouter from "@/routes/tag";
import blogRouter from "@/routes/blog";
import categoryRouter from "@/routes/category";

const BASE_PATH = "/api/v1";
export function appRouter(app: Application) {
  app.use("", healthRouter);
  app.use(BASE_PATH, authRouter);
  app.use(BASE_PATH, userRouter);
  app.use(BASE_PATH, tagRouter);
  app.use(BASE_PATH, blogRouter);
  app.use(BASE_PATH, categoryRouter);
}
