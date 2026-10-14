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
