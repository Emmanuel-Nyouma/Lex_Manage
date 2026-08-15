import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { DataProtectionService } from '../src/modules/security/data-protection.service';

const prisma = new PrismaClient();
const protection = new DataProtectionService();

async function main() {
  if (!protection.enabled) throw new Error('DATA_ENCRYPTION_KEY is required');

  const [cases, clients, documents, conversations, messages, auditLogs] = await Promise.all([
    prisma.case.findMany(),
    prisma.client.findMany(),
    prisma.document.findMany(),
    prisma.chatConversation.findMany(),
    prisma.chatMessage.findMany(),
    prisma.auditLog.findMany(),
  ]);

  for (const item of cases) {
    const title = protection.decrypt(item.title) as string;
    const description = protection.decrypt(item.description);
    const clientName = protection.decrypt(item.clientName) as string;
    const courtName = protection.decrypt(item.courtName);
    const caseNumber = protection.decrypt(item.caseNumber);
    await prisma.case.update({
      where: { id: item.id },
      data: {
        title: protection.encrypt(title) as string,
        description: protection.encrypt(description),
        clientName: protection.encrypt(clientName) as string,
        courtName: protection.encrypt(courtName),
        caseNumber: protection.encrypt(caseNumber),
        searchTokens: protection.searchTokens([
          title,
          description,
          clientName,
          courtName,
          caseNumber,
        ]),
      },
    });
  }

  for (const item of clients) {
    const name = protection.decrypt(item.name) as string;
    const email = protection.decrypt(item.email);
    const phone = protection.decrypt(item.phone);
    const address = protection.decrypt(item.address);
    await prisma.client.update({
      where: { id: item.id },
      data: {
        name: protection.encrypt(name) as string,
        email: protection.encrypt(email),
        phone: protection.encrypt(phone),
        address: protection.encrypt(address),
        searchTokens: protection.searchTokens([name, email, phone, address]),
      },
    });
  }

  for (const item of documents) {
    const title = protection.decrypt(item.title) as string;
    const fileName = protection.decrypt(item.file_name) as string;
    await prisma.document.update({
      where: { id: item.id },
      data: {
        title: protection.encrypt(title) as string,
        file_name: protection.encrypt(fileName) as string,
        searchTokens: protection.searchTokens([title, fileName, item.category]),
      },
    });
  }

  for (const item of conversations) {
    await prisma.chatConversation.update({
      where: { id: item.id },
      data: { title: protection.encrypt(protection.decrypt(item.title)) as string },
    });
  }

  for (const item of messages) {
    await prisma.chatMessage.update({
      where: { id: item.id },
      data: {
        content: protection.encrypt(protection.decrypt(item.content)) as string,
        sources:
          typeof item.sources === 'string' && item.sources.startsWith('enc:v1:')
            ? item.sources
            : protection.encryptJson(item.sources),
      },
    });
  }

  for (const item of auditLogs) {
    if (item.details === null) continue;
    await prisma.auditLog.update({
      where: { id: item.id },
      data: {
        details:
          typeof item.details === 'string' && item.details.startsWith('enc:v1:')
            ? item.details
            : protection.encryptJson(item.details),
      },
    });
  }

  console.log(
    `Encrypted ${cases.length} cases, ${clients.length} clients, ${documents.length} documents, ` +
      `${conversations.length} conversations, ${messages.length} messages and ${auditLogs.length} audit logs.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
