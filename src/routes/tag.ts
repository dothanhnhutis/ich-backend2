import { create, deleteTag, editTag, getAllTag, read } from "@/controllers/tag";
import checkPermission from "@/middleware/checkPermission";
import { authMiddleware } from "@/middleware/requiredAuth";
import validateResource from "@/middleware/validateResource";
import { createTagSchema, editTagSchema } from "@/schemas/tag";
import express, { type Router } from "express";

const router: Router = express.Router();
function tagRouter(): Router {
  router.patch(
    "/tags/:id",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    validateResource(editTagSchema),
    editTag
  );
  router.delete(
    "/tags/:id",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    deleteTag
  );
  router.get("/tags/:id", read);
  router.post(
    "/tags",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    validateResource(createTagSchema),
    create
  );
  router.get("/tags", getAllTag);
  return router;
}

export default tagRouter();
