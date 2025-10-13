import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, ConnectionStatus } from './connections.entity';
import { Repository } from 'typeorm';
import { CreateConnectionDto } from './dtos/createConnection.dto';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection) private readonly repo: Repository<Connection>,
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
    await this.repo.save(new_connection);
    return new_connection;
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
      order: { created_at: 'DESC' },
    });
  }
}
