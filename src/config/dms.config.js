export const DMS_CATEGORIES = [
  {
    id: 'actes_procedures',
    label: 'Actes de procédures',
    subCategories: []
  },
  {
    id: 'actes_judiciaires',
    label: 'Actes judiciaires',
    subCategories: []
  },
  {
    id: 'contrats_notaries',
    label: 'Contrats et actes notariés',
    subCategories: []
  },
  {
    id: 'pieces_preuves',
    label: 'Pièces et preuves',
    subCategories: []
  },
  {
    id: 'documents_clients',
    label: 'Documents clients',
    subCategories: [
      { id: 'docs_corporate', label: 'Documents corporate' },
      { id: 'mandats_autorisation', label: 'Mandats et autorisation' },
      { id: 'formulaires_unboarding', label: 'Formulaires d\'unboarding' }
    ]
  },
  {
    id: 'correspondance_communication',
    label: 'Correspondance et communication',
    subCategories: [
      { id: 'courriers_mails', label: 'Courriers et mails' },
      { id: 'messages_divers', label: 'Messages divers' }
    ]
  },
  {
    id: 'financier_administratifs',
    label: 'Document financier et administratifs',
    subCategories: [
      { id: 'factures_honoraires', label: 'Factures et notes d\'honoraires' },
      { id: 'recus_paiements', label: 'Reçu et preuves de paiements' },
      { id: 'docs_comptables', label: 'Documents comptables' }
    ]
  },
  {
    id: 'internes_cabinet',
    label: 'Documents internes du cabinet',
    subCategories: [
      { id: 'modeles_templates', label: 'Modèles templates de contrats et autres' },
      { id: 'notes_internes', label: 'Notes internes' },
      { id: 'politique_procedures', label: 'Politique de procédures du cabinet' },
      { id: 'rh_gestion', label: 'RH et gestion' }
    ]
  },
  {
    id: 'law_library',
    label: 'Law Library',
    subCategories: [
      { id: 'legislation_codes', label: 'Législation et codes' },
      { id: 'jurisprudence', label: 'Jurisprudence' },
      { id: 'doctrine_doctrine', label: 'Doctrine et commentaires' },
      { id: 'traites_conventions', label: 'Traités et conventions' }
    ]
  }
];

export const ACCESS_ROLES = [
  { id: 'ALL', label: 'Tout le monde' },
  { id: 'SUPER_ADMIN', label: 'Super Admin' },
  { id: 'CABINET_ADMIN', label: 'Cabinet Admin' },
  { id: 'LAWYER', label: 'Partners / Avocats' },
  { id: 'ASSISTANT', label: 'Associates / Assistants' },
  { id: 'SECRETARY', label: 'Secrétaires' }
];
