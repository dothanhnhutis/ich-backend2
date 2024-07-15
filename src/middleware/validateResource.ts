import { RequestHandler as Middleware } from "express";
import { AnyZodObject, ZodError } from "zod";
import { BadRequestError } from "../error-handler";

const validateResource =
  (schema: AnyZodObject): Middleware =>
  (req, _res, next) => {
    try {
      const data = schema.parse({
        params: req.params,
        body: req.body,
        query: req.query,
      });
      req.body = data.body;
      req.query = data.query;
      req.params = data.params;
      next();
    } catch (error: any) {
      if (error instanceof ZodError && !error.isEmpty)
        throw new BadRequestError(error.issues[0].message);
      next(error);
    }
  };
export default validateResource;
