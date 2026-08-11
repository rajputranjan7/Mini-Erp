import { NextFunction, Request, RequestHandler, Response } from "express";

// express-async-errors patches Express to catch rejected promises automatically,
// but wrapping handlers explicitly keeps intent obvious and works even if that
// patch is ever removed.
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
