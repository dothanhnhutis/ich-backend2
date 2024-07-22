import express, { type Router } from "express";
import {
  create,
  edit,
  read,
  readAll,
  remove,
  search,
} from "@/controllers/category";
import { authMiddleware } from "@/middleware/requiredAuth";
import checkPermission from "@/middleware/checkPermission";
import validateResource from "@/middleware/validateResource";
import {
  createCategorySchema,
  editCategorySchema,
  searchCategorySchema,
} from "@/schemas/category";

const router: Router = express.Router();
function categoryRouter(): Router {
  router.get(
    "/categories/_search",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    validateResource(searchCategorySchema),
    search
  );
  router.get("/categories/:id", read);
  router.get("/tags", readAll);
  router.post(
    "/categories",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    validateResource(createCategorySchema),
    create
  );
  router.patch(
    "/categories/:id",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    validateResource(editCategorySchema),
    edit
  );
  router.delete(
    "/categories/:id",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    remove
  );
  return router;
}

export default categoryRouter();
