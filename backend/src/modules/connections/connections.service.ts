import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, ConnectionStatus } from './connections.entity';
import { Repository } from 'typeorm';
import { CreateConnectionDto } from './dtos/createConnection.dto';
import { EventBusService } from 'src/common/events/event-bus.service';
import {
  ConnectionRequestEvent,
  ConnectionAcceptedEvent,
} from 'src/common/events/domain-events';
import { BillParticipant } from '../bills/bill-participant.entity';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection) private readonly repo: Repository<Connection>,
    @InjectRepository(BillParticipant) private readonly billParticipantRepo: Repository<BillParticipant>,
    private readonly eventBus: EventBusService,
  ) {}

  async createConnection(connection: CreateConnectionDto): Promise<Connection> {
    const old_connection = await this.repo.findOne({
      where: [
        {
          requester: { id: connection.requester_id },
          receiver: { id: connection.receiver_id },
        },
        {
          requester: { id: connection.receiver_id },
          receiver: { id: connection.requester_id },
        },
      ],
    });

    if (old_connection) {
      return old_connection;
    }

    const new_connection = this.repo.create({
      requester: { id: connection.requester_id },
      receiver: { id: connection.receiver_id },
    });
    const savedConnection = await this.repo.save(new_connection);

    // Load full user data to get names
    const fullConnection = await this.repo.findOne({
      where: { id: savedConnection.id },
      relations: ['requester', 'receiver'],
    });

    // Send notification to receiver about new connection request
    if (fullConnection && fullConnection.requester && fullConnection.receiver) {
      await this.eventBus.publish(
        new ConnectionRequestEvent(
          fullConnection.receiver.id,
          fullConnection.requester.name || fullConnection.requester.username,
          fullConnection.requester.id,
        ),
      );
    }

    return savedConnection;
  }

  async acceptRequest(
    connection_id: string,
    user_id: string,
  ): Promise<Connection> {
    const connection = await this.repo.findOne({
      where: {
        id: connection_id,
        receiver: { id: user_id },
        status: ConnectionStatus.Pending,
      },
      relations: ['requester', 'receiver'],
    });

    if (!connection) {
      throw new Error('No pending connection request found');
    }

    connection.status = ConnectionStatus.Connected;
    connection.accepted_at = new Date();
    await this.repo.save(connection);

    // Send notification to requester that their request was accepted
    await this.eventBus.publish(
      new ConnectionAcceptedEvent(
        connection.requester.id,
        connection.receiver.name || connection.receiver.username,
      ),
    );

    return connection;
  }

  async getConnectionByUserId(user_id: string): Promise<Connection | null> {
    return this.repo.findOne({
      where: [
        { requester: { id: user_id }, status: ConnectionStatus.Connected },
        { receiver: { id: user_id }, status: ConnectionStatus.Connected },
      ],
      relations: ['requester', 'receiver'],
    });
  }

  async getConnectionBetweenUsers(
    userId1: string,
    userId2: string,
  ): Promise<Connection | null> {
    return this.repo.findOne({
      where: [
        {
          requester: { id: userId1 },
          receiver: { id: userId2 },
          status: ConnectionStatus.Connected,
        },
        {
          requester: { id: userId2 },
          receiver: { id: userId1 },
          status: ConnectionStatus.Connected,
        },
      ],
      relations: ['requester', 'receiver'],
    });
  }

  async areUsersConnected(userId1: string, userId2: string): Promise<boolean> {
    const connection = await this.getConnectionBetweenUsers(userId1, userId2);
    return !!connection;
  }

  async getUserConnections(user_id: string): Promise<Connection[]> {
    return this.repo.find({
      where: [{ requester: { id: user_id } }, { receiver: { id: user_id } }],
      relations: ['requester', 'receiver'],
      order: { accepted_at: 'DESC' },
    });
  }

  async removeConnection(id: string, userId: string): Promise<{ success: boolean }> {
    // Ensure the current user is part of the connection
    const existing = await this.repo.findOne({
      where: [
        { id, requester: { id: userId } },
        { id, receiver: { id: userId } },
      ],
      relations: ['requester', 'receiver'],
    });

    if (!existing) {
      throw new BadRequestException('Connection not found or not authorized');
    }

    // Determine the other user in the connection
    const otherUserId = existing.requester.id === userId ? existing.receiver.id : existing.requester.id;

    // Check if either user is a participant in any active bills together
    const sharedBillParticipants = await this.billParticipantRepo
      .createQueryBuilder('bp')
      .innerJoin('bp.bill', 'bill')
      .where('bp.user_id IN (:...userIds)', { userIds: [userId, otherUserId] })
      .groupBy('bill.id')
      .having('COUNT(DISTINCT bp.user_id) = 2')
      .getCount();

    if (sharedBillParticipants > 0) {
      throw new BadRequestException(
        'Cannot remove connection. This user is part of one or more bill splits with you. Please settle or remove shared bills first.',
      );
    }

    await this.repo.delete({ id });
    return { success: true };
  }
}
