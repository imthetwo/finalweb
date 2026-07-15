import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}


  @Post('chat')
  chat(@Body() dto: ChatDto) {
    return this.ai.chat(dto.message, dto.history ?? []);
  }
}
