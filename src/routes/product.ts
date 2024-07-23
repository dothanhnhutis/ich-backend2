import {
  createProduct,
  editProduct,
  readAllProduct,
  readOneProduct,
  searchProduct,
} from "@/controllers/product";
import checkPermission from "@/middleware/checkPermission";
import { authMiddleware } from "@/middleware/requiredAuth";
import validateResource from "@/middleware/validateResource";
import express, { type Router } from "express";

const router: Router = express.Router();
function productRouter(): Router {
  router.post(
    "/products/",
    // authMiddleware(["emailVerified", "inActive", "suspended"]),
    // checkPermission(["ADMIN", "MANAGER"]),
    // validateResource(),
    createProduct
  );
  router.patch(
    "/products/:id",
    // authMiddleware(["emailVerified", "inActive", "suspended"]),
    // checkPermission(["ADMIN", "MANAGER"]),
    // validateResource(),
    editProduct
  );

  router.get(
    "/products/_search",
    // authMiddleware(["emailVerified", "inActive", "suspended"]),
    // checkPermission(["ADMIN", "MANAGER"]),
    // validateResource(),
    searchProduct
  );
  router.get("/products/:id", readOneProduct);
  router.get(
    "/products/",
    // authMiddleware(["emailVerified", "inActive", "suspended"]),
    // checkPermission(["ADMIN", "MANAGER"]),
    // validateResource(),
    readAllProduct
  );
  return router;
}

export default productRouter();
