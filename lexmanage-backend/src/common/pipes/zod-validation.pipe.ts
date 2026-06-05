import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    // When bound via @UsePipes(), this pipe runs against EVERY handler argument
    // (including @CurrentUser/@Param/@Query values). Only validate the request body.
    if (metadata.type !== 'body') {
      return value;
    }

    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }
    return result.data;
  }
}
