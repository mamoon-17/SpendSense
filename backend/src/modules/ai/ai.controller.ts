import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';
import { ChatWithAiDto } from './dtos/chat-with-ai.dto';
import { SendAiMessageDto } from './dtos/send-ai-message.dto';
import { AnalyzeFinancialsDto } from './dtos/analyze-financials.dto';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('conversation')
  async getOrCreateAiConversation(@Req() req: any) {
    const userId = req.user.userId;
    return this.aiService.getOrCreateAiConversation(userId);
  }

  @Get('messages')
  async getAiMessages(@Req() req: any) {
    const userId = req.user.userId;
    return this.aiService.getAiMessages(userId);
  }

  @Post('chat')
  async chat(@Req() req: any, @Body() dto: ChatWithAiDto) {
    const userId = req.user.userId;
    const result = await this.aiService.processCommandWithHistory(
      userId,
      dto.message,
    );
    return result;
  }

  @Post('send-message')
  async sendMessage(@Req() req: any, @Body() dto: SendAiMessageDto) {
    const aiUserId = 'ai-assistant'; // Special AI user ID
    return this.aiService.sendMessageToUser(
      aiUserId,
      dto.targetUserId,
      dto.message,
      dto.reason,
    );
  }

  @Post('analyze')
  async analyzeFinancials(@Req() req: any, @Body() dto: AnalyzeFinancialsDto) {
    const userId = req.user.userId;
    const analysis = await this.aiService.analyzeFinancialData(
      userId,
      dto.data,
    );
    return { analysis };
  }

  @Get('insights')
  async getInsights(@Req() req: any) {
    const userId = req.user.userId;
    return this.aiService.generateInsights(userId);
  }
}
