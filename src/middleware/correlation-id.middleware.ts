import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incomingCorrelationId = req.headers["x-correlation-id"];
    const correlationId = Array.isArray(incomingCorrelationId)
      ? incomingCorrelationId[0]
      : incomingCorrelationId || uuidv4();

    req["correlationId"] = correlationId;
    res.setHeader("X-Correlation-ID", correlationId);
    next();
  }
}
