import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { app } from './app.js';
import { prisma } from './config/db.js';
import { logger } from './config/logger.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('Connected to PostgreSQL Database via Prisma.');

    app.listen(PORT, () => {
      logger.info(` LimeSurvey Modern Backend API running on http://localhost:${PORT}`);
      logger.info(` OpenAPI / Swagger Documentation available at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start backend server:');
    process.exit(1);
  }
}

startServer();
