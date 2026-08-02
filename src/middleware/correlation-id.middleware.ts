import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

interface CorrelatedRequest extends Request {
  correlationId?: string;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: CorrelatedRequest, res: Response, next: NextFunction): void {
    const incomingCorrelationId = req.headers["x-correlation-id"];
    const fromHeader = Array.isArray(incomingCorrelationId)
      ? incomingCorrelationId[0]
      : incomingCorrelationId;
    const correlationId =
      fromHeader !== undefined && fromHeader !== "" ? fromHeader : uuidv4();

    req.correlationId = correlationId;
    res.setHeader("X-Correlation-ID", correlationId);
    next();
  }
}
