import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // Enable CORS
  await app.register(require('@fastify/cors'), {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });

  // Setup Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('DrillSergeant API')
    .setDescription('Production backend for DrillSergeant mobile app')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'Idempotency-Key', in: 'header' }, 'IdempotencyKey')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Export OpenAPI spec
  const fs = require('fs');
  fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
  console.log('📄 OpenAPI spec generated at ./openapi.json');

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 DrillSergeant API running on port ${port}`);
  console.log(`📚 API docs available at http://localhost:${port}/docs`);
}

bootstrap(); 