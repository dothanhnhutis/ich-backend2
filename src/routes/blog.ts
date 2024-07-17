import { create } from "@/controllers/blog";
import checkPermission from "@/middleware/checkPermission";
import { authMiddleware } from "@/middleware/requiredAuth";
import validateResource from "@/middleware/validateResource";
import { createBlogSchema } from "@/schemas/blog";
import express, { type Router } from "express";

const router: Router = express.Router();
function blogRouter(): Router {
  router.post(
    "/blogs",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER", "BLOGER"]),
    validateResource(createBlogSchema),
    create
  );
  return router;
}

export default blogRouter();
