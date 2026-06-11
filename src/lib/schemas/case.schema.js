import { z } from 'zod';

export const CreateCaseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional().or(z.literal('')),
  clientName: z.string().optional().or(z.literal('')),
  clientId: z.string().uuid().optional().nullable(),
  courtName: z.string().optional(),
  caseNumber: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "PENDING", "CLOSED", "ARCHIVED"]).default("OPEN"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().uuid().optional(),
  documentIds: z.array(z.string().uuid()).optional(),
});

export const UpdateCaseSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  clientName: z.string().optional(),
  clientId: z.string().uuid().optional().nullable(),
  courtName: z.string().optional(),
  caseNumber: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "PENDING", "CLOSED", "ARCHIVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().uuid().optional(),
  documentIds: z.array(z.string().uuid()).optional(),
});
