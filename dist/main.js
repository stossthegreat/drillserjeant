"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter());
    await app.register(require('@fastify/cors'), {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('DrillSergeant API')
        .setDescription('Production backend for DrillSergeant mobile app')
        .setVersion('1.0')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', name: 'Idempotency-Key', in: 'header' }, 'IdempotencyKey')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const fs = require('fs');
    fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
    console.log('📄 OpenAPI spec generated at ./openapi.json');
    const port = process.env.PORT || 8080;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 DrillSergeant API running on port ${port}`);
    console.log(`📚 API docs available at http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map