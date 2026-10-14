export const ROLES = {
  ADMIN: 'admin',
  VOTER: 'voter',
  SUPERADMIN: 'superadmin',
};

export const AUTH_COOKIE_NAME = 'ls_token';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};
