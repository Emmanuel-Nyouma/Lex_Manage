import { z } from 'zod';

export const ClientTypeEnum = z.enum(['physique', 'morale']);

export const CreateClientSchema = z.object({
  name:       z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(200),
  email:      z.string().email("Format d'email invalide").max(254).optional().or(z.literal('')),
  phone:      z.string().max(40).optional(),
  address:    z.string().max(500).optional(),
  type_client: ClientTypeEnum,
  // Tolerate '' from the frontend (unselected option) by mapping it to undefined
  caseId:     z.preprocess((v) => (v === '' ? undefined : v), z.string().uuid().optional()),
  deadlineId: z.preprocess((v) => (v === '' ? undefined : v), z.string().uuid().optional()),
});

export const UpdateClientSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  email: z.string().email().max(254).optional().or(z.literal('')),
  phone: z.string().max(40).optional(),
  address: z.string().max(500).optional(),
  type_client: ClientTypeEnum.optional(),
});
