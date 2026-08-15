import { z } from 'zod';

export const CreateCaseSchema = z.object({
  title: z.string().min(2, "Le titre doit faire au moins 2 caractères").max(200),
  description: z.string().max(5000).optional().or(z.literal('')),
  clientName: z.string().max(200).optional().or(z.literal('')),
  courtName: z.string().max(200).optional().or(z.literal('')),
  caseNumber: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(["OPEN", "IN_PROGRESS", "PENDING", "CLOSED", "ARCHIVED"]).default("OPEN"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().uuid().optional().nullable(),
  documentIds: z.array(z.string().uuid()).max(100).optional(),
});

export const UpdateCaseSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  courtName: z.string().max(200).optional(),
  caseNumber: z.string().max(100).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "PENDING", "CLOSED", "ARCHIVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().uuid().optional(),
  documentIds: z.array(z.string().uuid()).max(100).optional(),
});
