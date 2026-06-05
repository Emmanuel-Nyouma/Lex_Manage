import { z } from 'zod';

export const CreateCaseSchema = z.object({
  title: z.string().min(2, "Le titre doit faire au moins 2 caractères"),
  description: z.string().optional().or(z.literal('')),
  clientName: z.string().min(1, "Le nom du client est requis"),
  courtName: z.string().optional().or(z.literal('')),
  caseNumber: z.string().optional().or(z.literal('')),
  status: z.enum(["OPEN", "IN_PROGRESS", "PENDING", "CLOSED", "ARCHIVED"]).default("OPEN"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().uuid().optional().nullable(),
  documentIds: z.array(z.string().uuid()).optional(),
});

export const UpdateCaseSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  courtName: z.string().optional(),
  caseNumber: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "PENDING", "CLOSED", "ARCHIVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().uuid().optional(),
  documentIds: z.array(z.string().uuid()).optional(),
});
