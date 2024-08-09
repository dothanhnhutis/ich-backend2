import express, { type Router } from "express";

import { authMiddleware } from "@/middleware/requiredAuth";
import checkPermission from "@/middleware/checkPermission";
import validateResource from "@/middleware/validateResource";
import {
  createCategorySchema,
  editCategorySchema,
  searchCategorySchema,
} from "@/schemas/category";
import {
  createCategory,
  deleteCategory,
  editCategory,
  readAllCategory,
  readCategory,
  searchCategory,
} from "@/controllers/category";

const router: Router = express.Router();
function categoryRouter(): Router {
  router.get(
    "/categories/_search",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin", "Manager"]),
    validateResource(searchCategorySchema),
    searchCategory
  );
  router.get("/categories/:id", readCategory);
  router.get("/categories", readAllCategory);
  router.post(
    "/categories",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin", "Manager"]),
    validateResource(createCategorySchema),
    createCategory
  );
  router.patch(
    "/categories/:id",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin", "Manager"]),
    validateResource(editCategorySchema),
    editCategory
  );
  router.delete(
    "/categories/:id",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin", "Manager"]),
    deleteCategory
  );
  return router;
}

export default categoryRouter();
