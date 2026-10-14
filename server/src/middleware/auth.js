import jwt from 'jsonwebtoken';
import { AUTH_COOKIE_NAME, ROLES } from '../config/constants.js';

export const authenticate = (req, res, next) => {
  const token =
    req.cookies?.[AUTH_COOKIE_NAME] ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in to continue.',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.',
      },
    });
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      },
    });
  }

  // Superadmin has access to all admin routes
  const userRole = req.user.role;
  const isAllowed =
    allowedRoles.includes(userRole) ||
    (userRole === ROLES.SUPERADMIN && allowedRoles.includes(ROLES.ADMIN));

  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. You do not have permission for this resource.',
      },
    });
  }

  next();
};
