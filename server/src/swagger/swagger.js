export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'LimeSurvey Modern REST API',
    version: '1.0.0',
    description: 'RESTful API for LimeSurvey modernized stack (Node.js, Express, PostgreSQL, Prisma).',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Endpoint',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'ls_token',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['role', 'identifier'],
        properties: {
          role: {
            type: 'string',
            enum: ['voter', 'admin'],
            description: 'Authentication role',
            example: 'voter',
          },
          identifier: {
            type: 'string',
            description: 'Username or email (admin) / Voter Token or ID (voter)',
            example: 'admin',
          },
          password: {
            type: 'string',
            description: 'Password (required for admin, optional for token voter)',
            example: 'AdminPassword123!',
          },
          rememberMe: {
            type: 'boolean',
            description: 'Extend session duration to 30 days',
            example: false,
          },
        },
      },
      Survey: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          welcomeMessage: { type: 'string' },
          endMessage: { type: 'string' },
          active: { type: 'boolean' },
          format: { type: 'string' },
        },
      },
      Question: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          code: { type: 'string' },
          text: { type: 'string' },
          type: {
            type: 'string',
            enum: ['single_choice', 'multiple_choice', 'short_text', 'long_text', 'number', 'yes_no', 'date', 'rating'],
          },
          mandatory: { type: 'boolean' },
        },
      },
      ResponseSubmission: {
        type: 'object',
        required: ['answers'],
        properties: {
          answers: {
            type: 'object',
            description: 'Key-value map of question codes to answered values',
            example: {
              SATISFACTION: 'A1',
              FEEDBACK_TEXT: 'Great survey platform!',
            },
          },
          token: {
            type: 'string',
            description: 'Optional voter token / access code',
            example: 'VOTE-DEMO-2026',
          },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Universal Dual-Role Login (Admin or Voter)',
        description: 'Authenticates credentials strictly verifying role ownership and sets httpOnly cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Successful login' },
          401: { description: 'Invalid credentials' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Log out user and clear auth cookie',
        responses: {
          200: { description: 'Successfully logged out' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get currently authenticated user details',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/surveys/public': {
      get: {
        tags: ['Surveys'],
        summary: 'List active public surveys (Landing Page)',
        responses: {
          200: { description: 'List of active surveys' },
        },
      },
    },
    '/surveys': {
      get: {
        tags: ['Surveys'],
        summary: 'List all surveys (Admin)',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Surveys retrieved' },
        },
      },
      post: {
        tags: ['Surveys'],
        summary: 'Create a new survey',
        security: [{ cookieAuth: [] }],
        responses: {
          201: { description: 'Survey created' },
        },
      },
    },
    '/surveys/{id}': {
      get: {
        tags: ['Surveys'],
        summary: 'Get survey details with questions and options',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Survey details retrieved' },
          404: { description: 'Survey not found' },
        },
      },
      put: {
        tags: ['Surveys'],
        summary: 'Update survey metadata',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Survey updated' },
        },
      },
      delete: {
        tags: ['Surveys'],
        summary: 'Soft-delete survey',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Survey deleted' },
        },
      },
    },
    '/surveys/{id}/toggle-active': {
      patch: {
        tags: ['Surveys'],
        summary: 'Toggle active/published status of survey',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Status updated' },
        },
      },
    },
    '/surveys/{surveyId}/questions': {
      post: {
        tags: ['Questions'],
        summary: 'Add question to survey',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'surveyId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          201: { description: 'Question created' },
        },
      },
    },
    '/surveys/{surveyId}/voters': {
      get: {
        tags: ['Voters'],
        summary: 'List participants and access codes for survey',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'surveyId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Voters retrieved' },
        },
      },
      post: {
        tags: ['Voters'],
        summary: 'Create individual voter access token',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'surveyId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          201: { description: 'Voter created' },
        },
      },
    },
    '/surveys/{surveyId}/voters/batch': {
      post: {
        tags: ['Voters'],
        summary: 'Batch generate random voter access codes',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'surveyId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          201: { description: 'Tokens generated' },
        },
      },
    },
    '/surveys/{surveyId}/responses': {
      post: {
        tags: ['Responses'],
        summary: 'Submit answers to survey',
        parameters: [{ name: 'surveyId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResponseSubmission' },
            },
          },
        },
        responses: {
          201: { description: 'Response recorded' },
          400: { description: 'Validation error' },
        },
      },
      get: {
        tags: ['Responses'],
        summary: 'List raw survey submissions (Admin)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'surveyId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Responses retrieved' },
        },
      },
    },
    '/surveys/{surveyId}/statistics': {
      get: {
        tags: ['Statistics'],
        summary: 'Get aggregated statistical breakdown for survey',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'surveyId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Statistics returned' },
        },
      },
    },
    '/surveys/{surveyId}/export': {
      get: {
        tags: ['Export'],
        summary: 'Export survey responses to CSV or Excel XLSX',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'surveyId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv', 'xlsx'], default: 'csv' } },
        ],
        responses: {
          200: { description: 'File downloaded' },
        },
      },
    },
  },
};
