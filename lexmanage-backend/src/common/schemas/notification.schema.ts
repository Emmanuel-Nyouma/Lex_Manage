import { z } from 'zod';

export const MOTIF_LEVEL_CONSTRAINTS = {
  HEARING: 2,
  DEADLINE: 2,
  CONFLICT_DETECTED: 3,
};

export const MOTIF_ENUM = z.enum([
  'HEARING', 'INTERNAL_MEETING', 'DEADLINE', 'DOCUMENT_TO_SIGN', 
  'NEW_CLIENT', 'INVOICE_PENDING', 'LEGAL_UPDATE', 'INTERNAL_REMINDER', 
  'CONFLICT_DETECTED', 'OTHER'
]);

export const CreateNotificationSchema = z.object({
  title: z.string().min(1, "Sujet requis"),
  message: z.string().max(500, "Message trop long").optional(),
  level: z.number().int().min(1).max(3),
  motif: MOTIF_ENUM,
  recipientIds: z.array(z.string().uuid()).optional(),
}).refine((data) => {
  const minLevel = MOTIF_LEVEL_CONSTRAINTS[data.motif] || 1;
  return data.level >= minLevel;
}, {
  message: "Niveau insuffisant pour ce motif",
  path: ["level"],
});
