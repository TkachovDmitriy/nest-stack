import { OpenAPIObject } from '@nestjs/swagger';

export const openApiDocument: Omit<OpenAPIObject, 'paths'> = {
  openapi: '3.0.0',
  info: {
    title: 'Example',
    description: 'API description',
    version: '0.0.1',
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      BasicAuth: {
        type: 'http',
        scheme: 'basic',
      },
    },
  },
  security: [{ BearerAuth: [] }, { BasicAuth: [] }],
};
