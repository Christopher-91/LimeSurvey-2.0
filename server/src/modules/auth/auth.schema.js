import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    role: z.enum(['voter', 'admin'], {
      required_error: 'Role must be either voter or admin',
    }),
    identifier: z.string().trim().min(1, 'Please enter your username, email, or voter access code.'),
    password: z.string().optional().default(''),
    rememberMe: z.boolean().optional().default(false),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters long.')
      .max(64, 'Username cannot exceed 64 characters.')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens.'),
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address.')
      .max(192, 'Email cannot exceed 192 characters.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.'),
    fullName: z
      .string()
      .trim()
      .min(1, 'Please enter your full name.')
      .max(128, 'Full name cannot exceed 128 characters.')
      .optional(),
  }),
});
