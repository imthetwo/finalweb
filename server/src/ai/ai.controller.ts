import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  // Stricter than the app-wide default — each call costs money against a
  // paid external LLM API, unlike most routes the generic 60/60s just backstops.
  @Post('chat')
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  chat(@Body() dto: ChatDto) {
    return this.ai.chat(dto.message, dto.history ?? []);
  }
}
