import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';

@Module({
  controllers: [CalendarController],
})
export class CalendarModule {}
