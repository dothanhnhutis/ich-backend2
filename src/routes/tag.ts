import {
  createTag,
  deleteTag,
  readAllTag,
  readTag,
  searchTag,
  updateTag,
} from "@/controllers/tag";
import checkPermission from "@/middleware/checkPermission";
import { authMiddleware } from "@/middleware/requiredAuth";
import validateResource from "@/middleware/validateResource";
import { createTagSchema, editTagSchema, searchTagSchema } from "@/schemas/tag";
import express, { type Router } from "express";

const router: Router = express.Router();
function tagRouter(): Router {
  router.get(
    "/tags/_search",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin", "Manager"]),
    validateResource(searchTagSchema),
    searchTag
  );
  router.patch(
    "/tags/:id",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin", "Manager"]),
    validateResource(editTagSchema),
    updateTag
  );
  router.delete(
    "/tags/:id",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin", "Manager"]),
    deleteTag
  );
  router.get("/tags/:id", readTag);
  router.post(
    "/tags",
    authMiddleware(["emailVerified", "disabled", "suspended"]),
    checkPermission(["Admin", "Manager"]),
    validateResource(createTagSchema),
    createTag
  );
  router.get("/tags", readAllTag);
  return router;
}

export default tagRouter();
