export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'GuzoMate — Travelers Assistance & Road Safety API',
    version: '1.0.0',
    description:
      'API documentation for GuzoMate community road incident reporting, geospatial nearby searches, community verification, moderation, and safety alert notifications.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Path',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      StandardSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 50 },
              totalPages: { type: 'integer', example: 3 },
            },
          },
        },
      },
      StandardErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid request data' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['USER', 'MODERATOR', 'ADMIN'] },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] },
          preferredLanguage: { type: 'string', enum: ['en', 'am', 'om'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Incident: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: {
            type: 'string',
            enum: [
              'ACCIDENT',
              'ROAD_BLOCK',
              'ROAD_CLOSURE',
              'FLOODING',
              'LANDSLIDE',
              'ROAD_DAMAGE',
              'CONSTRUCTION',
              'HEAVY_TRAFFIC',
              'HAZARD',
              'OTHER',
            ],
          },
          description: { type: 'string' },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'RESOLVED', 'REJECTED', 'EXPIRED'] },
          verification: { type: 'string', enum: ['UNVERIFIED', 'COMMUNITY_CONFIRMED', 'MODERATOR_VERIFIED'] },
          location: {
            type: 'object',
            properties: {
              lat: { type: 'number', example: 9.03 },
              lon: { type: 'number', example: 38.74 },
            },
          },
          confirmationsCount: { type: 'integer', example: 3 },
          disputesCount: { type: 'integer', example: 0 },
          occurredAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Service health check with DB connection status',
        responses: {
          200: { description: 'Service is healthy' },
          500: { description: 'Service or database is unhealthy' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register new traveler account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'traveler@example.com' },
                  password: { type: 'string', format: 'password', example: 'Password123' },
                  name: { type: 'string', example: 'Abebe Bikila' },
                  preferredLanguage: { type: 'string', enum: ['en', 'am', 'om'], example: 'en' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User successfully registered' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login to obtain JWT access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'traveler@example.com' },
                  password: { type: 'string', format: 'password', example: 'Password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Authenticated user profile' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/users/me': {
      get: {
        summary: 'Get full profile of authenticated user',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Profile details' } },
      },
      patch: {
        summary: 'Update permitted profile fields',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Abebe Kebede' },
                  preferredLanguage: { type: 'string', enum: ['en', 'am', 'om'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Profile updated' } },
      },
    },
    '/users/me/notification-preferences': {
      get: {
        summary: 'Get user alert preferences',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Notification preferences' } },
      },
      patch: {
        summary: 'Update alert preferences',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  enabled: { type: 'boolean', example: true },
                  radiusMeters: { type: 'integer', example: 5000 },
                  incidentTypes: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Preferences updated' } },
      },
    },
    '/incidents': {
      get: {
        summary: 'Incident feed with filtering and sorting',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'severity', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'List of incidents' } },
      },
      post: {
        summary: 'Report a road incident',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'description', 'lat', 'lon'],
                properties: {
                  type: { type: 'string', example: 'ROAD_BLOCK' },
                  description: { type: 'string', example: 'Water pipe repair blocking right lane' },
                  severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
                  lat: { type: 'number', example: 9.0108 },
                  lon: { type: 'number', example: 38.7615 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Incident created in PENDING status' },
          409: { description: 'Duplicate report detected nearby' },
        },
      },
    },
    '/incidents/nearby': {
      get: {
        summary: 'Find road incidents near geographic coordinates using PostGIS',
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number', example: 9.03 } },
          { name: 'lon', in: 'query', required: true, schema: { type: 'number', example: 38.74 } },
          { name: 'radius', in: 'query', schema: { type: 'number', default: 5000, example: 5000 } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Nearby incidents ordered by distance' } },
      },
    },
    '/incidents/{id}': {
      get: {
        summary: 'Get incident details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Incident details' }, 404: { description: 'Not found' } },
      },
      patch: {
        summary: 'Update incident report description or severity',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  severity: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Incident updated' } },
      },
      delete: {
        summary: 'Withdraw own pending incident report or admin deletion',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Incident deleted' } },
      },
    },
    '/incidents/{id}/confirm': {
      post: {
        summary: 'Submit community confirmation or dispute vote for an incident',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action'],
                properties: {
                  action: { type: 'string', enum: ['CONFIRM', 'DISPUTE'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Vote recorded and lifecycle thresholds evaluated' },
          409: { description: 'User already voted with the same action' },
        },
      },
    },
    '/moderation/incidents': {
      get: {
        summary: 'Review queue for pending and disputed incidents (Moderator/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'disputedOnly', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Queue of incidents' } },
      },
    },
    '/moderation/incidents/{id}/status': {
      patch: {
        summary: 'Transition incident status with audit logging (Moderator/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['ACTIVE', 'RESOLVED', 'REJECTED', 'EXPIRED'] },
                  reason: { type: 'string', example: 'Verified with multiple corroborating reports' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Status updated and audited' } },
      },
    },
    '/moderation/incidents/{id}/history': {
      get: {
        summary: 'View moderation history and audit trail for an incident (Moderator/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Incident audit history' } },
      },
    },
    '/notifications': {
      get: {
        summary: 'List user notifications',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'In-app notifications' } },
      },
    },
    '/notifications/devices': {
      post: {
        summary: 'Register push device token',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string' },
                  platform: { type: 'string', enum: ['ios', 'android', 'web'] },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Device registered' } },
      },
    },
  },
};
