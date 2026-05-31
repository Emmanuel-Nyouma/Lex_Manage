import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create a Demo Tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'cabinet-demo' },
    update: {},
    create: {
      name: 'Cabinet Demo & Co',
      slug: 'cabinet-demo',
      country: 'France',
      city: 'Paris',
    },
  });

  console.log(`🏢 Created Tenant: ${demoTenant.name}`);

  // 2. Create Admin User for the Tenant
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash: hashedPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: Role.CABINET_ADMIN,
      tenantId: demoTenant.id,
    },
  });

  console.log(`👤 Created Admin User: ${adminUser.email}`);

  // 3. Create a Lawyer User
  const lawyerUser = await prisma.user.upsert({
    where: { email: 'lawyer@demo.com' },
    update: {},
    create: {
      email: 'lawyer@demo.com',
      passwordHash: hashedPassword,
      firstName: 'Marie',
      lastName: 'Curie',
      role: Role.LAWYER,
      tenantId: demoTenant.id,
    },
  });

  console.log(`👤 Created Lawyer User: ${lawyerUser.email}`);

  // 4. Create some Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Entreprise Globale SAS',
      email: 'contact@globale.fr',
      type_client: 'MORALE',
      tenantId: demoTenant.id,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Robert Martin',
      email: 'robert.martin@email.com',
      type_client: 'PHYSIQUE',
      tenantId: demoTenant.id,
    },
  });

  console.log(`👥 Created ${[client1, client2].length} Clients`);

  // 5. Create a Case
  const demoCase = await prisma.case.create({
    data: {
      title: 'Litige Commercial - Globale SAS vs X',
      description: 'Dossier de litige portant sur un défaut de paiement.',
      clientName: client1.name,
      caseNumber: 'CAS-2026-001',
      tenantId: demoTenant.id,
      assigneeId: lawyerUser.id,
      status: 'OPEN',
      priority: 'HIGH',
    },
  });

  console.log(`📁 Created Case: ${demoCase.title}`);

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
