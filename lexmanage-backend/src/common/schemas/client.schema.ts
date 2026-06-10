import { z } from 'zod';

export const ClientTypeEnum = z.enum(['physique', 'morale']);

export const CreateClientSchema = z.object({
  name:       z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email:      z.string().email("Format d'email invalide").optional().or(z.literal('')),
  phone:      z.string().optional(),
  address:    z.string().optional(),
  type_client: ClientTypeEnum,
  caseId:     z.string().uuid().optional(),
  deadlineId: z.string().uuid().optional(),
});

export const UpdateClientSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  type_client: ClientTypeEnum.optional(),
});
