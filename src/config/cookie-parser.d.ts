/**
 * Minimal type declaration for `cookie-parser` (the package ships no types
 * and @types/cookie-parser is not installed). Only the surface main.ts uses
 * is declared.
 */
declare module "cookie-parser" {
  import type { NextFunction, Request, Response } from "express";

  function cookieParser(
    secret?: string | string[],
    options?: { decode?: (value: string) => string },
  ): (req: Request, res: Response, next: NextFunction) => void;

  export = cookieParser;
}
