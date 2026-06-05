import { promises as fs } from 'fs';

import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';

import { AppModule } from '../src/app.module';
import { openApiDocument } from '../src/infrastructure/configs/swagger.config';

async function generateSwaggerDoc(): Promise<void> {
  try {
    // Create a standalone application
    const app = await NestFactory.create(AppModule, {
      logger: ['error'], // Minimize console output
    });

    patchNestJsSwagger();
    // Generate Swagger document
    const document = SwaggerModule.createDocument(app, openApiDocument);

    // Get output path from command line args
    const outputPathArg = process.argv.find((arg) => arg.startsWith('--output='));
    const outputDir = outputPathArg ? outputPathArg.split('=')[1] : './swagger';

    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    // Generate JSON
    await fs.writeFile(`${outputDir}/swagger.json`, JSON.stringify(document, null, 2), 'utf8');

    console.log(`✅ Swagger JSON generated successfully at ${outputDir}/swagger.json`);

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to generate Swagger documentation:', error);
    process.exit(1);
  }
}

generateSwaggerDoc();
