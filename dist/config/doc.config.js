"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('doc', () => ({
    name: `${process.env.APP_MODULE} APIs Specification`,
    description: "This is the Bills to Pay of a company where has the following functionality <br><br> GET, ADD, UPDATE, REMOVE purchases orders",
    version: '1.0',
    prefix: '/docs',
}));
//# sourceMappingURL=doc.config.js.map