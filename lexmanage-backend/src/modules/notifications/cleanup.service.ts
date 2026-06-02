import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MinioService } from '../documents/minio.service';

@Injectable()
export class CleanupService implements OnModuleInit {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  onModuleInit() {
    // Run daily
    setInterval(() => this.cleanupAbandonedDocuments(), 86400000);
  }

  async cleanupAbandonedDocuments() {
    this.logger.log('Running abandoned document cleanup...');
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const abandoned = await this.prisma.document.findMany({
      where: {
        isPending: true,
        createdAt: { lt: oneDayAgo },
      },
    });

    for (const doc of abandoned) {
      this.logger.log(`Cleaning up abandoned document: ${doc.id}`);
      await this.minio.deleteFile(doc.tenantId, doc.file_url).catch(err => this.logger.error(`MinIO delete failed: ${err.message}`));
      await this.prisma.document.delete({ where: { id: doc.id } });
    }
  }
}
