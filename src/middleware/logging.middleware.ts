import { Logger, type NestMiddleware } from "@nestjs/common";
import { type NextFunction, type Request, type Response } from "express";

export class LoggingMiddleware implements NestMiddleware {
  logger = new Logger("Response");
  constructor() {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl: url } = req;
    const reqTime = Date.now();
    res.on("finish", () => {
      const { statusCode } = res;
      const resTime = Date.now();
      if (statusCode === 201 || statusCode === 200) {
        this.logger.log(
          `${method} ${url} ${statusCode} - ${resTime - reqTime} ms`,
        );
      }
    });
    next();
  }
}
