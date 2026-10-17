import { AUTH_COOKIE_NAME, COOKIE_OPTIONS } from '../../config/constants.js';
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
