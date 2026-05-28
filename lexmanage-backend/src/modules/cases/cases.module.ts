import { Module, forwardRef } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { DeadlinesController } from './deadlines.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [forwardRef(() => EventsModule)],
  controllers: [CasesController, DeadlinesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
