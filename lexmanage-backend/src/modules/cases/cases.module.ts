import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { DeadlinesController } from './deadlines.controller';
import { EventsModule } from '../events/events.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    forwardRef(() => EventsModule), 
    AuditModule,
    BullModule.registerQueue({ name: 'reminders' }),
  ],
  controllers: [CasesController, DeadlinesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
