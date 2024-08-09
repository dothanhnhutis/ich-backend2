import {
  createBlog,
  readBlog,
  searchBlog,
  updateBlog,
} from "@/controllers/blog";
import checkPermission from "@/middleware/checkPermission";
import { authMiddleware } from "@/middleware/requiredAuth";
import validateResource from "@/middleware/validateResource";
import { createBlogSchema, queryblogSchema } from "@/schemas/blog";
import express, { type Router } from "express";

const router: Router = express.Router();
function blogRouter(): Router {
  router.post(
    "/blogs",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin", "Manager", "Bloger"]),
    validateResource(createBlogSchema),
    createBlog
  );
  router.patch(
    "/blogs/:id",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin", "Manager", "Bloger"]),
    validateResource(createBlogSchema),
    updateBlog
  );
  router.get("/blogs/_search", validateResource(queryblogSchema), searchBlog);

  router.get("/blogs/:id", readBlog);

  return router;
}

export default blogRouter();
