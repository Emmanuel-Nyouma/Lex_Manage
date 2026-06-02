import { z } from 'zod';

export const UserRoleEnum = z.enum([
  'SUPER_ADMIN',
  'CABINET_ADMIN',
  'LAWYER',
  'ASSISTANT',
  'SECRETARY',
]);

export const CreateUserSchema = z.object({
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
  role: UserRoleEnum,
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  role: UserRoleEnum.optional(),
});
