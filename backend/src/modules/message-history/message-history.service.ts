import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageStatus } from './message-history.entity';
import { CreateMessageDto } from './dtos/create-message.dto';
import { GetMessagesDto } from './dtos/get-messages.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationType } from '../conversations/conversations.entity';

@Injectable()
export class MessageHistoryService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly conversationsService: ConversationsService,
  ) {}

  // Special method for AI messages - bypasses participant check
  async createAiMessage(
    senderId: string, // 'ai-assistant' or user ID
    conversationId: string,
    content: string,
  ): Promise<Message> {
    const conversation =
      await this.conversationsService.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Only allow for AI conversations
    if (conversation.type !== ConversationType.AI) {
      throw new ForbiddenException('This method is only for AI conversations');
    }

    const isAiSender = senderId === 'ai-assistant';

    // Create the message
    const message = this.messageRepository.create({
      content: content,
      sender: isAiSender ? null : { id: senderId },
      ai_sender_id: isAiSender ? 'ai-assistant' : null,
      conversation: { id: conversationId },
      status: MessageStatus.SENT,
      is_read: false,
      delivered_at: null,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation's last message
    await this.conversationsService.updateLastMessage(
      conversationId,
      savedMessage.id,
    );

    // Return message with relations
    const messageWithRelations = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['conversation', 'sender'],
    });

    if (!messageWithRelations) {
      throw new NotFoundException('Failed to retrieve created message');
    }

    return messageWithRelations;
  }

  // Get messages for AI conversation (bypasses participant check)
  async getAiConversationMessages(
    conversationId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    const conversation =
      await this.conversationsService.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Only allow for AI conversations
    if (conversation.type !== ConversationType.AI) {
      throw new ForbiddenException('This method is only for AI conversations');
    }

    const { page = 1, limit = 100 } = options;
    const skip = (page - 1) * limit;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversation: { id: conversationId } },
      order: { sent_at: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      messages: messages.reverse(), // Return in chronological order
      total,
      page,
      limit,
    };
  }
  async createMessage(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    // Validate that the conversation exists and sender is a participant
    const conversation = await this.conversationsService.findById(
      createMessageDto.conversation_id,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if sender is a participant in the conversation
    const isParticipant = conversation.participants.some(
      (participant) => participant.id === senderId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Create the message
    const message = this.messageRepository.create({
      content: createMessageDto.content,
      sender: { id: senderId },
      conversation: { id: createMessageDto.conversation_id },
      status: MessageStatus.SENT,
      is_read: false,
      delivered_at: null,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation's last message and unread count
    await this.conversationsService.updateLastMessage(
      createMessageDto.conversation_id,
      savedMessage.id,
    );

    // Return message with relations
    const messageWithRelations = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'conversation'],
    });

    if (!messageWithRelations) {
      throw new NotFoundException('Failed to retrieve created message');
    }

    return messageWithRelations;
  }

  async getMessageHistory(
    conversationId: string,
    userId: string,
    getMessagesDto: GetMessagesDto,
  ): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Validate that user is a participant in the conversation
    const conversation =
      await this.conversationsService.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.id === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const { page = 1, limit = 20 } = getMessagesDto;
    const skip = (page - 1) * limit;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversation: { id: conversationId } },
      relations: ['sender'],
      order: { sent_at: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      messages: messages.reverse(), // Return in chronological order
      total,
      page,
      limit,
    };
  }

  async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    userId: string,
  ): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'conversation', 'conversation.participants'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only participants can update message status
    const isParticipant = message.conversation.participants.some(
      (participant) => participant.id === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Don't allow sender to mark their own message as read
    if (message.sender?.id === userId && status === MessageStatus.READ) {
      return message;
    }

    message.status = status;

    // Update delivered_at when status changes to DELIVERED
    if (status === MessageStatus.DELIVERED && !message.delivered_at) {
      message.delivered_at = new Date();
    }

    // Update is_read when status changes to READ
    if (status === MessageStatus.READ) {
      message.is_read = true;
    }

    return this.messageRepository.save(message);
  }

  async markMessagesAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // Validate user is participant
    const conversation =
      await this.conversationsService.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.id === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Mark all unread messages as read (except user's own messages)
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({
        status: MessageStatus.READ,
        is_read: true,
      })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('is_read = false')
      .execute();

    // Reset unread count for this conversation
    await this.conversationsService.resetUnreadCount(conversationId);
  }
}
