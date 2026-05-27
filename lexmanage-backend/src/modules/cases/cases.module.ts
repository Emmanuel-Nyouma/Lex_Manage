import { Module, forwardRef } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { DeadlinesController } from './deadlines.controller';
import { EventsModule } from '../events/events.module';
import { EventsGateway } from '../../gateway/events.gateway';

@Module({
  imports: [forwardRef(() => EventsModule)],
  controllers: [CasesController, DeadlinesController],
  providers: [CasesService, EventsGateway],
  exports: [CasesService],
})
export class CasesModule {}
