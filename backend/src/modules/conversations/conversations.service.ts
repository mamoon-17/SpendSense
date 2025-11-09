import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation, ConversationType } from './conversations.entity';
import { CreateConversationDto } from './dtos/create-conversation.dto';
import { ConnectionsService } from '../connections/connections.service';
import { ConnectionStatus } from '../connections/connections.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly connectionsService: ConnectionsService,
    private readonly usersService: UsersService,
  ) {}

  async createConversation(
    creatorId: string,
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    const { participant_ids, type, name, budget_id, billSplit_id } =
      createConversationDto;

    // Ensure creator is included in participants
    const allParticipantIds = [...new Set([creatorId, ...participant_ids])];

    // For direct conversations, only allow 2 participants
    if (type === ConversationType.Direct && allParticipantIds.length !== 2) {
      throw new BadRequestException(
        'Direct conversations must have exactly 2 participants',
      );
    }

    // Validate all participants exist
    const participants = await this.usersService.findByIds(allParticipantIds);
    if (participants.length !== allParticipantIds.length) {
      throw new NotFoundException('One or more participants not found');
    }

    // Validate connections between participants
    // For direct chats: all participants must be connected to each other
    // For group chats: creator must be connected to each participant (participants don't need to be connected to each other)
    if (type === ConversationType.Direct) {
      await this.validateConnections(allParticipantIds);
    } else {
      // For group chats, only validate that creator is connected to each participant
      await this.validateGroupConnections(creatorId, participant_ids);
    }

    // Check if direct conversation already exists between these users
    if (type === ConversationType.Direct) {
      const existingConversation =
        await this.findDirectConversation(allParticipantIds);
      if (existingConversation) {
        return existingConversation;
      }
    }

    // Create conversation
    const conversation = this.conversationRepository.create({
      name,
      type,
      budget_id,
      billSplit_id,
      participants,
      unread_count: 0,
    });

    return this.conversationRepository.save(conversation);
  }

  async getActiveConversationsForUser(userId: string): Promise<Conversation[]> {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .leftJoinAndSelect('conversation.last_message', 'last_message')
      .leftJoinAndSelect('last_message.sender', 'message_sender')
      .where('participant.id = :userId', { userId })
      .orderBy('conversation.updated_at', 'DESC')
      .getMany();
  }

  async findById(conversationId: string): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants', 'last_message'],
    });
  }

  async findDirectConversation(
    participantIds: string[],
  ): Promise<Conversation | null> {
    if (participantIds.length !== 2) return null;

    return this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .where('conversation.type = :type', { type: ConversationType.Direct })
      .andWhere(
        'conversation.id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = :user1)',
        { user1: participantIds[0] },
      )
      .andWhere(
        'conversation.id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = :user2)',
        { user2: participantIds[1] },
      )
      .getOne();
  }

  async updateLastMessage(
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    await this.conversationRepository.update(
      { id: conversationId },
      {
        last_message: { id: messageId },
        last_message_at: new Date(),
        updated_at: new Date(),
      },
    );

    // Increment unread count for all participants except the sender
    await this.conversationRepository
      .createQueryBuilder()
      .update(Conversation)
      .set({ unread_count: () => 'unread_count + 1' })
      .where('id = :conversationId', { conversationId })
      .execute();
  }

  async resetUnreadCount(conversationId: string): Promise<void> {
    // This would typically be implemented with a user-specific unread count table
    // For now, we'll reset the global unread count when any user reads messages
    await this.conversationRepository.update(
      { id: conversationId },
      { unread_count: 0 },
    );
  }

  private async validateConnections(participantIds: string[]): Promise<void> {
    // Check that all participants are connected to each other
    for (let i = 0; i < participantIds.length; i++) {
      for (let j = i + 1; j < participantIds.length; j++) {
        const userId1 = participantIds[i];
        const userId2 = participantIds[j];

        const areConnected = await this.connectionsService.areUsersConnected(
          userId1,
          userId2,
        );

        if (!areConnected) {
          throw new ForbiddenException(
            `Users are not connected and cannot start a conversation`,
          );
        }
      }
    }
  }

  private async validateGroupConnections(
    creatorId: string,
    participantIds: string[],
  ): Promise<void> {
    // For group chats, only check that creator is connected to each participant
    // Participants don't need to be connected to each other
    for (const participantId of participantIds) {
      if (participantId === creatorId) continue; // Skip self

      const areConnected = await this.connectionsService.areUsersConnected(
        creatorId,
        participantId,
      );

      if (!areConnected) {
        throw new ForbiddenException(
          `You are not connected to ${participantId} and cannot add them to the group`,
        );
      }
    }
  }
}
