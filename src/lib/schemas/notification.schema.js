import { z } from 'zod';

export const MOTIF_LEVEL_CONSTRAINTS = {
  HEARING: 2,
  DEADLINE: 2,
  CONFLICT_DETECTED: 3,
};

export const LEVEL_MAP = {
  1: 'NORMAL',
  2: 'IMPORTANT',
  3: 'URGENT',
};

export const MOTIF_OPTIONS = [
  { value: 'HEARING', label: 'Audience imminente' },
  { value: 'INTERNAL_MEETING', label: 'Réunion interne' },
  { value: 'DEADLINE', label: 'Délai procédural' },
  { value: 'DOCUMENT_TO_SIGN', label: 'Document à signer' },
  { value: 'NEW_CLIENT', label: 'Nouveau client' },
  { value: 'INVOICE_PENDING', label: 'Facture en attente' },
  { value: 'LEGAL_UPDATE', label: 'Mise à jour légale' },
  { value: 'INTERNAL_REMINDER', label: 'Rappel interne' },
  { value: 'CONFLICT_DETECTED', label: 'Conflit d\'intérêt' },
  { value: 'OTHER', label: 'Autre' },
];

export const ROLE_OPTIONS = [
  { value: 'CABINET_ADMIN', label: 'Administrateurs' },
  { value: 'LAWYER', label: 'Avocats / Partners' },
  { value: 'ASSISTANT', label: 'Assistants' },
  { value: 'SECRETARY', label: 'Secrétaires' },
];

export const CreateNotificationSchema = z.object({
  title: z.string().optional(),
  message: z.string().max(500, "Message trop long").optional(),
  levelNum: z.number().int().min(1).max(3),
  level: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']),
  motif: z.enum(MOTIF_OPTIONS.map(m => m.value)),
  recipientIds: z.array(z.string().uuid()).optional(),
  recipientRoles: z.array(z.string()).optional(),
  caseId: z.string().uuid().optional().or(z.literal('')),
}).refine((data) => {
  const minLevel = MOTIF_LEVEL_CONSTRAINTS[data.motif] || 1;
  return data.levelNum >= minLevel;
}, {
  message: "Niveau insuffisant pour ce motif",
  path: ["levelNum"],
});
