import { Controller, Get } from '@nestjs/common';

@Controller('custom-lab')
export class CustomLabController {
  @Get('steps')
  steps() {
    return [];
  }
}
