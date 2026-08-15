import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MinioService } from '../documents/minio.service';
import { tenantContext } from '../../common/context/tenant.context';

@Injectable()
@Processor('maintenance')
export class CleanupService implements OnModuleInit {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
    @InjectQueue('maintenance') private maintenanceQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.maintenanceQueue.add(
      'cleanup-abandoned-documents',
      {},
      {
        jobId: 'cleanup-abandoned-documents',
        repeat: { cron: '0 3 * * *' },
        removeOnComplete: true,
      },
    );
  }

  @Process('cleanup-abandoned-documents')
  async cleanupAbandonedDocuments(_job?: Job) {
    this.logger.log('Running abandoned document cleanup...');
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const abandoned = await tenantContext.runUnscoped(() =>
      this.prisma.document.findMany({
        where: {
          isPending: true,
          createdAt: { lt: oneDayAgo },
        },
      }),
    );

    for (const doc of abandoned) {
      await tenantContext.run(doc.tenantId, async () => {
        this.logger.log(`Cleaning up abandoned document: ${doc.id}`);
        await this.minio.deleteFile(doc.tenantId, doc.file_url);
        await this.prisma.document.delete({ where: { id: doc.id } });
      }).catch((error) => {
        this.logger.error(`Cleanup failed for document ${doc.id}`, error as Error);
      });
    }
  }
}
