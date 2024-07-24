import {
  createProduct,
  editProduct,
  readProduct,
  searchProduct,
} from "@/controllers/product";
import checkPermission from "@/middleware/checkPermission";
import { authMiddleware } from "@/middleware/requiredAuth";
import validateResource from "@/middleware/validateResource";
import {
  createProductSchema,
  editProductSchema,
  searchProductSchema,
} from "@/schemas/product";
import express, { type Router } from "express";

const router: Router = express.Router();
function productRouter(): Router {
  router.post(
    "/products/",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    validateResource(createProductSchema),
    createProduct
  );
  router.patch(
    "/products/:id",
    authMiddleware(["emailVerified", "inActive", "suspended"]),
    checkPermission(["ADMIN", "MANAGER"]),
    validateResource(editProductSchema),
    editProduct
  );

  router.get(
    "/products/_search",
    validateResource(searchProductSchema),
    searchProduct
  );
  router.get("/products/:id", readProduct);

  return router;
}

export default productRouter();
