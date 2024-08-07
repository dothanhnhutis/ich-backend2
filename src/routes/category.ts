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
    checkPermission(["ADMIN", "MANAGER"]),
    validateResource(searchCategorySchema),
    searchCategory
  );
  router.get("/categories/:id", readCategory);
  router.get("/categories", readAllCategory);
  router.post(
    "/categories",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    validateResource(createCategorySchema),
    createCategory
  );
  router.patch(
    "/categories/:id",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    validateResource(editCategorySchema),
    editCategory
  );
  router.delete(
    "/categories/:id",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    deleteCategory
  );
  return router;
}

export default categoryRouter();
