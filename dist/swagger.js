"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const setupSwagger = async (app) => {
    const configService = app.get(config_1.ConfigService);
    const logger = new common_1.Logger();
    const docName = configService.get('doc.name');
    const docDesc = configService.get('doc.description');
    const docVersion = configService.get('doc.version');
    const docPrefix = configService.get('doc.prefix');
    const documentBuild = new swagger_1.DocumentBuilder()
        .setTitle(docName)
        .setDescription(docDesc)
        .setVersion(docVersion)
        .addTag(`${process.env.APP_MODULE}`)
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, documentBuild, {
        deepScanRoutes: true,
    });
    const customOptions = {
        swaggerOptions: {
            persistAuthorization: true,
        },
    };
    swagger_1.SwaggerModule.setup(docPrefix, app, document, {
        explorer: true,
        customSiteTitle: docName,
        ...customOptions,
    });
    logger.log(`Docs will serve on ${docPrefix}`, 'NestApplication');
};
exports.setupSwagger = setupSwagger;
//# sourceMappingURL=swagger.js.map