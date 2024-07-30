"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const helmet_1 = require("helmet");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app/app.module");
const platform_express_1 = require("@nestjs/platform-express");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const swagger_1 = require("./swagger");
const dotenv = require("dotenv");
const logger = new common_1.Logger();
dotenv.config();
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(express()), {
        cors: true,
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('app.http.port');
    const host = configService.get('app.http.host');
    const globalPrefix = configService.get('app.globalPrefix');
    const versioningPrefix = configService.get('app.versioning.prefix');
    const version = configService.get('app.versioning.version');
    const versionEnable = configService.get('app.versioning.enable');
    app.use((0, helmet_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.setGlobalPrefix(globalPrefix);
    if (versionEnable) {
        app.enableVersioning({
            type: common_1.VersioningType.URI,
            defaultVersion: version,
            prefix: versioningPrefix,
        });
    }
    await (0, swagger_1.setupSwagger)(app);
    await app.listen(port, host);
    logger.log(`🚀 ${configService.get('app.name')} service started successfully on port ${port}`);
}
bootstrap().catch(error => {
    logger.debug(error);
    logger.error(error, null, 'Bootstrap');
});
//# sourceMappingURL=main.js.map