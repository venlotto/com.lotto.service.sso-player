"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
class LoggingMiddleware {
    constructor() {
        this.logger = new common_1.Logger('Response');
    }
    use(req, res, next) {
        const { method, originalUrl: url } = req;
        const reqTime = new Date().getTime();
        res.on('finish', () => {
            const { statusCode } = res;
            const resTime = new Date().getTime();
            if (statusCode === 201 || statusCode === 200) {
                this.logger.log(`${method} ${url} ${statusCode} - ${resTime - reqTime} ms`);
            }
        });
        next();
    }
}
exports.LoggingMiddleware = LoggingMiddleware;
//# sourceMappingURL=logging.middleware.js.map