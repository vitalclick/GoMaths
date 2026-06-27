// MUST be first so Sentry's instrumentation patches NodeJS internals
// before any application code imports them.
import "./instrument";

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger, ValidationPipe } from "@nestjs/common";
import * as Sentry from "@sentry/node";
import { AppModule } from "./app.module";
import { assertConfig } from "./config/config.validation";

async function bootstrap() {
  // Validate configuration before anything else. In production this aborts
  // the boot on insecure/missing critical settings rather than silently
  // serving from ephemeral in-memory fallbacks.
  assertConfig(process.env, new Logger("Config"));

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix("api");

  // Wire Nest's exception layer into Sentry. Express's default error
  // handler runs Sentry.setupExpressErrorHandler under the hood when DSN
  // is set; this also captures async errors that surface through the
  // Nest pipeline.
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app.getHttpAdapter().getInstance());
  }

  const config = new DocumentBuilder()
    .setTitle("GoMaths Backend API")
    .setDescription("Core REST API for GoMaths")
    .setVersion("0.0.1")
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, doc);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`backend-api listening on :${port}`);
}

bootstrap();
