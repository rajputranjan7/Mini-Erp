import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

interface Schemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

// Validates req.body / req.query / req.params against the given zod schemas
// and replaces them with the parsed (typed, coerced) values on success.
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as any;
      if (schemas.params) req.params = schemas.params.parse(req.params) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw ApiError.badRequest(
          "Validation failed",
          err.errors.map((e) => ({ path: e.path.join("."), message: e.message }))
        );
      }
      throw err;
    }
  };
}
