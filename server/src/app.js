import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import authRoutes from './modules/auth/auth.routes.js';
import exportRoutes from './modules/export/export.routes.js';
import questionRoutes from './modules/questions/question.routes.js';
import responseRoutes from './modules/responses/response.routes.js';
import statsRoutes from './modules/stats/stats.routes.js';
import surveyRoutes from './modules/surveys/survey.routes.js';
import voterRoutes from './modules/voters/voter.routes.js';
import { swaggerDocument } from './swagger/swagger.js';

export const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI and local development
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration for Client (http://localhost:5173 default)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Structured HTTP Logging
app.use(
  pinoHttp({
    logger,
    autoLogging: process.env.NODE_ENV !== 'test',
  })
);

// General Rate Limiter
app.use('/api/', generalLimiter);

// OpenAPI / Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/surveys', surveyRoutes);
app.use('/api/v1', questionRoutes);
app.use('/api/v1', voterRoutes);
app.use('/api/v1', responseRoutes);
app.use('/api/v1', statsRoutes);
app.use('/api/v1', exportRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `API route not found: ${req.method} ${req.originalUrl}`,
    },
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);
