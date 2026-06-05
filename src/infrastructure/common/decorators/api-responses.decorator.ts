import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export interface ApiResponseConfig {
  status: number;
  description: string;
  type?: any;
  schema?: any;
}

export interface StandardApiResponsesConfig {
  200?: {
    description?: string;
    type?: any;
    schema?: any;
  };
  201?: {
    description?: string;
    type?: any;
    schema?: any;
  };
  400?: {
    description?: string;
    type?: any;
    schema?: any;
  };
  401?: {
    description?: string;
    type?: any;
    schema?: any;
  };
  403?: {
    description?: string;
    type?: any;
    schema?: any;
  };
  404?: {
    description?: string;
    type?: any;
    schema?: any;
  };
  409?: {
    description?: string;
    type?: any;
    schema?: any;
  };
  422?: {
    description?: string;
    type?: any;
    schema?: any;
  };
  500?: {
    description?: string;
    type?: any;
    schema?: any;
  };
}

// Default standard responses
const DEFAULT_RESPONSES: StandardApiResponsesConfig = {
  200: {
    description: 'Operation completed successfully',
  },
  400: {
    description: 'Bad request',
  },
  401: {
    description: 'Unauthorized',
  },
  403: {
    description: 'Forbidden',
  },
  404: {
    description: 'Resource not found',
  },
  409: {
    description: 'Resource already exists',
  },
  422: {
    description: 'Validation failed',
  },
  500: {
    description: 'Internal server error',
  },
};

export function StandardApiResponses(
  config: StandardApiResponsesConfig = {},
): MethodDecorator & ClassDecorator {
  const responses = { ...DEFAULT_RESPONSES, ...config };

  const decorators = Object.entries(responses)
    .map(([status, response]) => {
      if (!response) return null;

      return ApiResponse({
        status: parseInt(status),
        description: response.description,
        type: response.type,
        schema: response.schema,
      });
    })
    .filter((decorator): decorator is NonNullable<typeof decorator> => decorator !== null);

  return applyDecorators(...decorators);
}

// Convenience function for common patterns
export function ApiResponses(...responses: ApiResponseConfig[]): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ...responses.map((response) =>
      ApiResponse({
        status: response.status,
        description: response.description,
        type: response.type,
        schema: response.schema,
      }),
    ),
  );
}
