import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';

export class AuthService {
  /**
   * Universal Login Handler for both Admins and Voters
   * Strictly enforces that credentials belong exclusively to the selected role.
   */
  static async login({ role, identifier, password, rememberMe }) {
    const genericErrorMessage =
      role === 'admin'
        ? 'Invalid username/email or password.'
        : 'Invalid voter ID, access code or password.';

    // ==========================================
    // 1. ADMIN LOGIN
    // ==========================================
    if (role === 'admin') {
      if (!password) {
        const error = new Error(genericErrorMessage);
        error.statusCode = 401;
        throw error;
      }

      // Check if user exists as an admin
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: identifier, mode: 'insensitive' } },
            { email: { equals: identifier, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
      });

      if (!user || !user.isActive) {
        logger.warn({ identifier }, 'Admin login failed: user not found or inactive');
        const error = new Error(genericErrorMessage);
        error.statusCode = 401;
        throw error;
      }

      // Verify bcrypt password (including PHP $2y$ legacy hashes)
      // bcrypt in node supports $2a$, $2b$, and $2y$ (if prefixed with $2a$ or normalized)
      let normalizedHash = user.password;
      if (normalizedHash.startsWith('$2y$')) {
        normalizedHash = '$2a$' + normalizedHash.slice(4);
      }

      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(password, normalizedHash);
      } catch (err) {
        logger.error({ err }, 'Error comparing bcrypt hash');
        isMatch = false;
      }

      if (!isMatch) {
        logger.warn({ identifier }, 'Admin login failed: password mismatch');
        const error = new Error(genericErrorMessage);
        error.statusCode = 401;
        throw error;
      }

      // If user had a legacy $2y$ hash, automatically re-hash to latest $2b$ format
      if (user.password.startsWith('$2y$')) {
        const modernHash = await bcrypt.hash(password, 12);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: modernHash },
        });
        logger.info({ userId: user.id }, 'Upgraded legacy PHP $2y$ hash to modern bcrypt hash.');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Issue JWT
      const expiresIn = rememberMe ? '30d' : process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn }
      );

      return {
        role: 'admin',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        redirectTo: '/admin/dashboard',
      };
    }

    // ==========================================
    // 2. VOTER LOGIN
    // ==========================================
    if (role === 'voter') {
      // Find voter by token (access code) or voterId or email
      const voter = await prisma.voter.findFirst({
        where: {
          OR: [
            { token: identifier },
            { voterId: identifier },
            { email: { equals: identifier, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        include: {
          survey: {
            select: {
              id: true,
              title: true,
              active: true,
              expires: true,
            },
          },
        },
      });

      if (!voter) {
        logger.warn({ identifier }, 'Voter login failed: voter token not found');
        const error = new Error(genericErrorMessage);
        error.statusCode = 401;
        throw error;
      }

      // Check survey validity
      if (!voter.survey || !voter.survey.active) {
        const error = new Error('The survey assigned to this voter access code is currently inactive or closed.');
        error.statusCode = 403;
        throw error;
      }

      if (voter.survey.expires && new Date() > new Date(voter.survey.expires)) {
        const error = new Error('This survey has expired.');
        error.statusCode = 403;
        throw error;
      }

      // Check date validity
      if (voter.validFrom && new Date() < new Date(voter.validFrom)) {
        const error = new Error('Your survey access code is not yet active.');
        error.statusCode = 403;
        throw error;
      }

      if (voter.validUntil && new Date() > new Date(voter.validUntil)) {
        const error = new Error('Your survey access code has expired.');
        error.statusCode = 403;
        throw error;
      }

      // Check optional voter password
      if (voter.password) {
        if (!password) {
          const error = new Error(genericErrorMessage);
          error.statusCode = 401;
          throw error;
        }
        let passMatch = false;
        try {
          passMatch = await bcrypt.compare(password, voter.password);
        } catch {
          passMatch = voter.password === password;
        }
        if (!passMatch) {
          const error = new Error(genericErrorMessage);
          error.statusCode = 401;
          throw error;
        }
      }

      // Check if already completed
      if (voter.completed && voter.usesLeft <= 0) {
        const error = new Error('This survey access code has already been used and submitted.');
        error.statusCode = 400;
        throw error;
      }

      // Issue voter JWT
      const expiresIn = '24h';
      const token = jwt.sign(
        {
          id: voter.id,
          voterId: voter.voterId,
          token: voter.token,
          email: voter.email,
          surveyId: voter.surveyId,
          role: 'voter',
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn }
      );

      return {
        role: 'voter',
        token,
        user: {
          id: voter.id,
          voterId: voter.voterId,
          token: voter.token,
          email: voter.email,
          firstName: voter.firstName,
          lastName: voter.lastName,
          surveyId: voter.surveyId,
          surveyTitle: voter.survey.title,
          role: 'voter',
        },
        redirectTo: `/surveys/${voter.surveyId}/take?token=${voter.token}`,
      };
    }

    const error = new Error('Invalid authentication role specified.');
    error.statusCode = 400;
    throw error;
  }

  /**
   * Retrieve current authenticated user details
   */
  static async getMe(userPayload) {
    if (userPayload.role === 'admin' || userPayload.role === 'superadmin') {
      const user = await prisma.user.findUnique({
        where: { id: userPayload.id },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          lastLogin: true,
          createdAt: true,
        },
      });
      if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
      }
      return { ...user, role: 'admin' };
    }

    if (userPayload.role === 'voter') {
      const voter = await prisma.voter.findUnique({
        where: { id: userPayload.id },
        include: {
          survey: {
            select: {
              id: true,
              title: true,
              description: true,
              active: true,
            },
          },
        },
      });
      if (!voter) {
        const error = new Error('Voter not found.');
        error.statusCode = 404;
        throw error;
      }
      return {
        id: voter.id,
        voterId: voter.voterId,
        token: voter.token,
        email: voter.email,
        firstName: voter.firstName,
        lastName: voter.lastName,
        completed: voter.completed,
        surveyId: voter.surveyId,
        survey: voter.survey,
        role: 'voter',
      };
    }

    const error = new Error('Invalid user role.');
    error.statusCode = 400;
    throw error;
  }
}
