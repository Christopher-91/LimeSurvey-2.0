import jwt from 'jsonwebtoken';
import { AUTH_COOKIE_NAME, COOKIE_OPTIONS } from '../../config/constants.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthService } from './auth.service.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const { role, identifier, password, rememberMe } = req.body;
      const result = await AuthService.login({ role, identifier, password, rememberMe });

      // Set JWT in httpOnly cookie
      const cookieOptions = {
        ...COOKIE_OPTIONS,
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
      };
      res.cookie(AUTH_COOKIE_NAME, result.token, cookieOptions);

      // Record audit log for admin logins
      if (result.role === 'admin' || result.role === 'superadmin') {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
        const userAgent = req.headers['user-agent'];
        await AuditService.log({
          userId: result.user?.id,
          username: result.user?.username || identifier,
          email: result.user?.email,
          fullName: result.user?.fullName,
          action: 'LOGIN',
          ipAddress,
          userAgent,
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          role: result.role,
          redirectTo: result.redirectTo,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async register(req, res, next) {
    try {
      const { username, email, password, fullName } = req.body;
      const result = await AuthService.register({ username, email, password, fullName });

      res.cookie(AUTH_COOKIE_NAME, result.token, COOKIE_OPTIONS);

      // Record audit log for new admin registration
      const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
      const userAgent = req.headers['user-agent'];
      await AuditService.log({
        userId: result.user?.id,
        username: result.user?.username || username,
        email: result.user?.email || email,
        fullName: result.user?.fullName || fullName,
        action: 'LOGIN',
        ipAddress,
        userAgent,
        details: { note: 'Initial admin registration' },
      });

      return res.status(201).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          role: result.role,
          redirectTo: result.redirectTo,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res) {
    // If authenticated token exists in cookie or header, log the admin logout event
    const token =
      req.cookies?.[AUTH_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        if (decoded && (decoded.role === 'admin' || decoded.role === 'superadmin')) {
          const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
          const userAgent = req.headers['user-agent'];
          await AuditService.log({
            userId: decoded.id,
            username: decoded.username || 'admin',
            email: decoded.email,
            fullName: decoded.fullName,
            action: 'LOGOUT',
            ipAddress,
            userAgent,
          });
        }
      } catch (_) {
        // Token was invalid or expired, continue logout
      }
    }

    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Successfully logged out.',
      },
    });
  }

  static async me(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user);
      return res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user);
      return res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
