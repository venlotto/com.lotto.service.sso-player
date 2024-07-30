"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    name: process.env.APP_NAME ?? 'purchases orders',
    env: process.env.APP_ENV ?? 'development',
    versioning: {
        enable: process.env.HTTP_VERSIONING_ENABLE === 'true' ?? false,
        prefix: 'v',
        version: process.env.HTTP_VERSION ?? '1',
    },
    globalPrefix: '/api',
    http: {
        enable: process.env.HTTP_ENABLE === 'true' ?? false,
        host: process.env.HTTP_HOST ?? '0.0.0.0',
        port: process.env.HTTP_PORT
            ? Number.parseInt(process.env.HTTP_PORT)
            : '9004',
    },
}));
//# sourceMappingURL=app.config.js.map