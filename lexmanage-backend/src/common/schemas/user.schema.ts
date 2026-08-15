import { z } from 'zod';

export const AssignableUserRoleEnum = z.enum([
  'CABINET_ADMIN',
  'LAWYER',
  'ASSISTANT',
  'SECRETARY',
]);

export const CreateUserSchema = z.object({
  firstName: z.string().min(2, "Le prénom est requis").max(100),
  lastName: z.string().min(2, "Le nom est requis").max(100),
  email: z.string().email("Format d'email invalide").max(254),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères").max(128),
  role: AssignableUserRoleEnum,
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  role: AssignableUserRoleEnum.optional(),
});
