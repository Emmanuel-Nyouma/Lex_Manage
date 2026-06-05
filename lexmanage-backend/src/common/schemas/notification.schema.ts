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

export const LEVEL_ENUM = z.enum(['NORMAL', 'IMPORTANT', 'URGENT']);

export const ROLE_ENUM = z.enum([
  'SUPER_ADMIN', 'CABINET_ADMIN', 'LAWYER', 'ASSISTANT', 'SECRETARY',
]);

const levelSatisfiesMotif = (data: { level: 'NORMAL' | 'IMPORTANT' | 'URGENT'; motif: keyof typeof MOTIF_LEVEL_CONSTRAINTS | string }) => {
  const minLevelMap = { NORMAL: 1, IMPORTANT: 2, URGENT: 3 } as const;
  const minLevelRequired = MOTIF_LEVEL_CONSTRAINTS[data.motif as keyof typeof MOTIF_LEVEL_CONSTRAINTS] || 1;
  return minLevelMap[data.level] >= minLevelRequired;
};

export const CreateNotificationSchema = z.object({
  title: z.string().optional(),
  message: z.string().max(500, "Message trop long").optional(),
  level: LEVEL_ENUM,
  motif: MOTIF_ENUM,
  recipientIds: z.array(z.string().uuid()).optional(),
  recipientRoles: z.array(ROLE_ENUM).optional(),
  caseId: z.string().uuid().optional().nullable(),
}).refine(levelSatisfiesMotif, {
  message: "Niveau insuffisant pour ce motif",
  path: ["level"],
});

export const CreateTemplateSchema = z.object({
  name: z.string().trim().min(1, "Le nom du template est requis").max(120, "Nom trop long"),
  title: z.string().max(200, "Sujet trop long").optional(),
  message: z.string().max(500, "Message trop long").optional(),
  level: LEVEL_ENUM,
  motif: MOTIF_ENUM,
  recipientRoles: z.array(ROLE_ENUM).optional().default([]),
}).refine(levelSatisfiesMotif, {
  message: "Niveau insuffisant pour ce motif",
  path: ["level"],
});

export const CreateScheduledSchema = z.object({
  title: z.string().max(200, "Sujet trop long").optional(),
  message: z.string().max(500, "Message trop long").optional(),
  level: LEVEL_ENUM,
  motif: MOTIF_ENUM,
  recipientRoles: z.array(ROLE_ENUM).optional().default([]),
  caseId: z.string().uuid("Identifiant de dossier invalide").optional(),
  scheduledAt: z.string().datetime({ offset: true, message: "Date planifiée invalide (format ISO attendu)" })
    .refine((val) => new Date(val).getTime() > Date.now(), {
      message: "La date planifiée doit être dans le futur",
    }),
}).refine(levelSatisfiesMotif, {
  message: "Niveau insuffisant pour ce motif",
  path: ["level"],
});
