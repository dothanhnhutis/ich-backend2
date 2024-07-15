import express, { type Router } from "express";
import { health } from "@/controllers/health";

const router: Router = express.Router();
function healthRouter(): Router {
  router.get("/health", health);
  return router;
}

export default healthRouter();
