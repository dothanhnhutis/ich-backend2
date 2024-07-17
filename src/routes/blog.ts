import { create, read, searchBlog, update } from "@/controllers/blog";
import checkPermission from "@/middleware/checkPermission";
import { authMiddleware } from "@/middleware/requiredAuth";
import validateResource from "@/middleware/validateResource";
import { createBlogSchema } from "@/schemas/blog";
import { getBlogBySlug } from "@/services/blog";
import express, { query, type Router } from "express";

const router: Router = express.Router();
function blogRouter(): Router {
  router.post(
    "/blogs",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER", "BLOGER"]),
    validateResource(createBlogSchema),
    create
  );
  router.patch(
    "/blogs/:id",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER", "BLOGER"]),
    validateResource(createBlogSchema),
    update
  );
  router.get("/blogs/_search", searchBlog);

  router.get("/blogs/:id", read);

  return router;
}

export default blogRouter();
